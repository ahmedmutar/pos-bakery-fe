import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Plus, ChevronDown, ChevronUp, Loader2, CheckCircle, Truck, Package, X, RotateCcw } from 'lucide-react'
import { poApi, supplierApi, type POStatus, type CreatePOPayload } from '../services/purchaseOrderService'
import { formatCurrency, cn } from '../lib/utils'
import api from '../lib/api'

const STATUS_LABEL: Record<POStatus, string> = {
  DRAFT:     'Draft',
  ORDERED:   'Dipesan',
  PARTIAL:   'Sebagian Diterima',
  RECEIVED:  'Diterima',
  CANCELLED: 'Dibatalkan',
}
const STATUS_COLOR: Record<POStatus, string> = {
  DRAFT:     'bg-surface-100 text-muted-500',
  ORDERED:   'bg-blue-100 text-blue-600',
  PARTIAL:   'bg-amber-100 text-amber-700',
  RECEIVED:  'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-500',
}

interface IngredientOption { id: string; name: string; baseUnit: string; currentStock: number }

export default function PurchaseOrdersPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<POStatus | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [receiveId, setReceiveId] = useState<string | null>(null)
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({})

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchase-orders', statusFilter],
    queryFn: () => poApi.list(statusFilter ? { status: statusFilter as POStatus } : undefined),
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierApi.list(),
  })

  const { data: ingredients = [] } = useQuery<IngredientOption[]>({
    queryKey: ['ingredients-simple'],
    queryFn: async () => (await api.get('/inventory/ingredients')).data,
  })

  const orderMutation = useMutation({
    mutationFn: poApi.order,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })

  const receiveMutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: { itemId: string; receivedQty: number }[] }) =>
      poApi.receive(id, items),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); setReceiveId(null) },
  })

  const cancelMutation = useMutation({
    mutationFn: poApi.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['purchase-orders'] }),
  })

  const totalByStatus = (s: POStatus) => pos.filter(p => p.status === s).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary-600" />
            Purchase Order
          </h1>
          <p className="font-body text-sm text-muted-400 mt-0.5">Kelola pembelian bahan baku dari supplier</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Buat PO
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['', 'DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const).map(s => (
          <button
            key={s || 'ALL'}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-body font-medium whitespace-nowrap border transition-all',
              statusFilter === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-muted-500 border-surface-200 hover:bg-surface-100'
            )}
          >
            {s ? `${STATUS_LABEL[s as POStatus]} (${totalByStatus(s as POStatus)})` : `Semua (${pos.length})`}
          </button>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreatePOForm
          suppliers={suppliers}
          ingredients={ingredients}
          onClose={() => setShowCreate(false)}
          onCreate={async (data) => {
            await poApi.create(data)
            qc.invalidateQueries({ queryKey: ['purchase-orders'] })
            setShowCreate(false)
          }}
        />
      )}

      {/* PO list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-muted-400 animate-spin" /></div>
      ) : pos.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="font-body text-sm text-muted-400">Belum ada Purchase Order</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pos.map((po) => (
            <div key={po.id} className="card overflow-hidden">
              {/* Header row */}
              <div
                className="p-4 flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === po.id ? null : po.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-body text-sm font-semibold text-dark-800">
                      {po.poNumber ?? `PO-${po.id.slice(-6).toUpperCase()}`}
                    </span>
                    <span className={cn('text-xs font-body font-medium px-2 py-0.5 rounded-full', STATUS_COLOR[po.status])}>
                      {STATUS_LABEL[po.status]}
                    </span>
                  </div>
                  <p className="font-body text-xs text-muted-400">
                    {po.supplier?.name ?? 'Tanpa supplier'} · {new Date(po.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {po.items.length} item
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-base font-bold text-dark-800">{formatCurrency(po.totalAmount)}</p>
                </div>
                {expandedId === po.id ? <ChevronUp className="w-4 h-4 text-muted-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-400 flex-shrink-0" />}
              </div>

              {/* Expanded detail */}
              {expandedId === po.id && (
                <div className="border-t border-surface-100 p-4 space-y-4">
                  {/* Items table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-surface-100">
                          <th className="pb-2 font-body text-xs text-muted-400 font-semibold">Bahan</th>
                          <th className="pb-2 font-body text-xs text-muted-400 font-semibold text-right">Pesan</th>
                          <th className="pb-2 font-body text-xs text-muted-400 font-semibold text-right">Diterima</th>
                          <th className="pb-2 font-body text-xs text-muted-400 font-semibold text-right">Harga/Unit</th>
                          <th className="pb-2 font-body text-xs text-muted-400 font-semibold text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {po.items.map(item => (
                          <tr key={item.id} className="border-b border-surface-50 last:border-0">
                            <td className="py-2 font-body text-sm text-dark-800">{item.ingredient.name}</td>
                            <td className="py-2 font-body text-sm text-right text-muted-600">{item.quantity} {item.unit}</td>
                            <td className="py-2 font-body text-sm text-right">
                              <span className={cn(
                                item.receivedQty >= item.quantity ? 'text-green-600' : item.receivedQty > 0 ? 'text-amber-600' : 'text-muted-400'
                              )}>
                                {item.receivedQty} {item.unit}
                              </span>
                            </td>
                            <td className="py-2 font-body text-sm text-right text-muted-600">{formatCurrency(item.pricePerUnit)}</td>
                            <td className="py-2 font-body text-sm text-right font-semibold text-dark-800">{formatCurrency(item.quantity * item.pricePerUnit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Receive form */}
                  {receiveId === po.id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                      <p className="font-body text-sm font-semibold text-blue-800">Masukkan qty yang diterima:</p>
                      {po.items.filter(i => i.receivedQty < i.quantity).map(item => (
                        <div key={item.id} className="flex items-center gap-3">
                          <span className="font-body text-sm text-dark-800 flex-1">{item.ingredient.name}</span>
                          <span className="font-body text-xs text-muted-400">sisa: {item.quantity - item.receivedQty} {item.unit}</span>
                          <input
                            type="number"
                            min={0}
                            max={item.quantity - item.receivedQty}
                            value={receiveQtys[item.id] ?? ''}
                            onChange={e => setReceiveQtys(r => ({ ...r, [item.id]: e.target.value }))}
                            className="input w-24 text-sm py-1.5"
                            placeholder="0"
                          />
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button onClick={() => setReceiveId(null)} className="btn-secondary flex-1 text-sm">Batal</button>
                        <button
                          disabled={receiveMutation.isPending}
                          onClick={() => {
                            const items = Object.entries(receiveQtys)
                              .filter(([, qty]) => parseFloat(qty) > 0)
                              .map(([itemId, qty]) => ({ itemId, receivedQty: parseFloat(qty) }))
                            if (items.length > 0) receiveMutation.mutate({ id: po.id, items })
                          }}
                          className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                        >
                          {receiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Package className="w-4 h-4" /> Konfirmasi Terima</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {po.status === 'DRAFT' && (
                      <button
                        disabled={orderMutation.isPending}
                        onClick={() => orderMutation.mutate(po.id)}
                        className="btn-primary flex items-center gap-2 text-sm"
                      >
                        <Truck className="w-4 h-4" />
                        Tandai Dipesan
                      </button>
                    )}
                    {(po.status === 'ORDERED' || po.status === 'PARTIAL') && receiveId !== po.id && (
                      <button
                        onClick={() => { setReceiveId(po.id); setReceiveQtys({}) }}
                        className="btn-primary flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Terima Barang
                      </button>
                    )}
                    {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                      <button
                        disabled={cancelMutation.isPending}
                        onClick={() => { if (confirm('Batalkan PO ini?')) cancelMutation.mutate(po.id) }}
                        className="btn-secondary flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Batalkan
                      </button>
                    )}
                  </div>

                  {po.notes && (
                    <p className="font-body text-xs text-muted-500 bg-surface-50 rounded-xl px-3 py-2">{po.notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Create PO Form ────────────────────────────────────────────────────────────
interface CreatePOFormProps {
  suppliers: { id: string; name: string }[]
  ingredients: IngredientOption[]
  onClose: () => void
  onCreate: (data: CreatePOPayload) => Promise<void>
}

function CreatePOForm({ suppliers, ingredients, onClose, onCreate }: CreatePOFormProps) {
  const [supplierId, setSupplierId] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ingredientId: '', quantity: '', unit: '', unitFactor: '1', pricePerUnit: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addRow() {
    setItems(prev => [...prev, { ingredientId: '', quantity: '', unit: '', unitFactor: '1', pricePerUnit: '' }])
  }
  function removeRow(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateRow(i: number, field: string, val: string) {
    setItems(prev => prev.map((row, idx) => {
      if (idx !== i) return row
      if (field === 'ingredientId') {
        const ing = ingredients.find(ing => ing.id === val)
        return { ...row, ingredientId: val, unit: ing?.baseUnit ?? row.unit }
      }
      return { ...row, [field]: val }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const validItems = items.filter(i => i.ingredientId && parseFloat(i.quantity) > 0 && i.unit && parseInt(i.pricePerUnit) >= 0)
    if (validItems.length === 0) return setError('Tambahkan minimal 1 item')
    setSaving(true)
    try {
      await onCreate({
        supplierId: supplierId || null,
        poNumber: poNumber || null,
        date,
        notes: notes || null,
        items: validItems.map(i => ({
          ingredientId: i.ingredientId,
          quantity: parseFloat(i.quantity),
          unit: i.unit,
          unitFactor: parseFloat(i.unitFactor) || 1,
          pricePerUnit: parseInt(i.pricePerUnit) || 0,
        })),
      })
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal membuat PO')
    } finally {
      setSaving(false)
    }
  }

  const total = items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseInt(i.pricePerUnit) || 0), 0)

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-warm-lg">
        <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-dark-800">Buat Purchase Order</h2>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Supplier</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="input">
                <option value="">Tanpa supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">No. PO (opsional)</label>
              <input type="text" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="input" placeholder="PO-001" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Tanggal</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-sm font-semibold text-dark-800">Item Bahan Baku</p>
              <button type="button" onClick={addRow} className="btn-secondary px-3 py-1 text-xs flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah
              </button>
            </div>
            <div className="space-y-2">
              {items.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <select value={row.ingredientId} onChange={e => updateRow(i, 'ingredientId', e.target.value)} className="input text-sm py-2">
                      <option value="">Pilih bahan</option>
                      {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input type="number" min={0} value={row.quantity} onChange={e => updateRow(i, 'quantity', e.target.value)} className="input text-sm py-2" placeholder="Qty" />
                  </div>
                  <div className="col-span-2">
                    <input type="text" value={row.unit} onChange={e => updateRow(i, 'unit', e.target.value)} className="input text-sm py-2" placeholder="Satuan" />
                  </div>
                  <div className="col-span-3">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-400">Rp</span>
                      <input type="number" min={0} value={row.pricePerUnit} onChange={e => updateRow(i, 'pricePerUnit', e.target.value)} className="input text-sm py-2 pl-7" placeholder="Harga/unit" />
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-center pt-2">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} className="text-muted-300 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1">Catatan</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="input" placeholder="Catatan PO (opsional)" />
          </div>

          {error && <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
        </form>

        <div className="px-5 py-4 border-t border-surface-200 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1">
            <p className="font-body text-xs text-muted-400">Total PO</p>
            <p className="font-display text-xl font-bold text-dark-800">{formatCurrency(total)}</p>
          </div>
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat PO'}
          </button>
        </div>
      </div>
    </div>
  )
}
