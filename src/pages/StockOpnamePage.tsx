import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Plus, ChevronRight, CheckCircle, Clock, Loader2, X, Save } from 'lucide-react'
import { stockApi, type StockOpname } from '../services/stockService'
import { usePlan } from '../hooks/usePlan'
import { cn } from '../lib/utils'

// ─── List View ───────────────────────────────────────────────────────────────
export default function StockOpnamePage() {
  const { data: plan } = usePlan()
  const [selected, setSelected] = useState<StockOpname | null>(null)
  const [creating, setCreating] = useState(false)
  const qc = useQueryClient()

  const { data: opnames = [], isLoading } = useQuery({
    queryKey: ['stock-opname'],
    queryFn: stockApi.listOpname,
  })

  const createMutation = useMutation({
    mutationFn: (notes?: string) => stockApi.createOpname(notes),
    onSuccess: (opname) => {
      qc.invalidateQueries({ queryKey: ['stock-opname'] })
      setSelected(opname)
      setCreating(false)
    },
  })

  if (!plan?.limits.hasExcelImport) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ClipboardCheck className="w-12 h-12 text-dough-300 mb-4" />
        <h2 className="font-display text-lg font-semibold text-oven-800 mb-2">Stock Opname</h2>
        <p className="font-body text-sm text-crust-400 max-w-xs">
          Fitur ini tersedia untuk paket Pro dan Enterprise. Upgrade untuk mengakses stock opname penuh.
        </p>
      </div>
    )
  }

  if (selected) {
    return <OpnameDetail opname={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-oven-800">Stock Opname</h1>
          <p className="font-body text-sm text-crust-400 mt-0.5">Rekonsiliasi stok sistem vs fisik</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Mulai Opname
        </button>
      </div>

      {/* Create modal */}
      {creating && (
        <CreateOpnameModal
          onConfirm={(notes) => createMutation.mutate(notes)}
          onClose={() => setCreating(false)}
          isPending={createMutation.isPending}
        />
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-crust-400" />
        </div>
      ) : opnames.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ClipboardCheck className="w-10 h-10 text-dough-300 mb-3" />
          <p className="font-body text-sm text-crust-400">Belum ada stock opname</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opnames.map((op) => (
            <button
              key={op.id}
              onClick={() => setSelected(op)}
              className="w-full card flex items-center justify-between hover:shadow-warm-lg transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center',
                  op.status === 'FINISHED' ? 'bg-green-100' : 'bg-amber-100'
                )}>
                  {op.status === 'FINISHED'
                    ? <CheckCircle className="w-5 h-5 text-green-600" />
                    : <Clock className="w-5 h-5 text-amber-600" />}
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-oven-800">
                    Opname {new Date(op.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-body text-xs text-crust-400">
                    {op.user.name} · {op.items.length} bahan
                    {op.status === 'FINISHED' && op.finishedAt && (
                      <span className="ml-1 text-green-500">· Selesai</span>
                    )}
                    {op.status === 'DRAFT' && (
                      <span className="ml-1 text-amber-500">· Dalam proses</span>
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-crust-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateOpnameModal({
  onConfirm, onClose, isPending,
}: {
  onConfirm: (notes?: string) => void
  onClose: () => void
  isPending: boolean
}) {
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100">
          <h2 className="font-display text-base font-semibold text-oven-800">Mulai Stock Opname</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-crust-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-dough-50 border border-dough-200 rounded-xl px-4 py-3">
            <p className="font-body text-sm text-crust-600">
              Sistem akan mengambil snapshot stok saat ini untuk semua bahan baku. Anda kemudian memasukkan qty fisik hasil hitung.
            </p>
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opname bulanan, opname akhir tahun, dll"
              className="input"
              autoFocus
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => onConfirm(notes || undefined)}
            disabled={isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Mulai
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Detail View ─────────────────────────────────────────────────────────────
function OpnameDetail({ opname: initial, onBack }: { opname: StockOpname; onBack: () => void }) {
  const qc = useQueryClient()

  const { data: opname = initial } = useQuery({
    queryKey: ['stock-opname', initial.id],
    queryFn: () => stockApi.getOpname(initial.id),
    initialData: initial,
  })

  const [physicalQtys, setPhysicalQtys] = useState<Record<string, string>>(
    Object.fromEntries(opname.items.map((i) => [i.id, i.physicalQty !== null ? String(i.physicalQty) : '']))
  )

  const saveMutation = useMutation({
    mutationFn: () => stockApi.updateItems(opname.id, 
      opname.items
        .filter((i) => physicalQtys[i.id] !== '')
        .map((i) => ({
          id: i.id,
          physicalQty: parseFloat(physicalQtys[i.id]) || 0,
        }))
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-opname', opname.id] }),
  })

  const finishMutation = useMutation({
    mutationFn: () => stockApi.finishOpname(opname.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock-opname'] })
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      onBack()
    },
  })

  const filledCount = opname.items.filter((i) => physicalQtys[i.id] !== '').length
  const isFinished = opname.status === 'FINISHED'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-dough-100 text-crust-500 transition-colors">
          ← 
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold text-oven-800">Detail Opname</h1>
          <p className="font-body text-xs text-crust-400">
            {new Date(opname.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            · {opname.user.name}
            {isFinished && <span className="ml-1 text-green-500">· Selesai</span>}
          </p>
        </div>
        {!isFinished && (
          <div className="flex gap-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Simpan
            </button>
            <button
              onClick={() => {
                if (confirm(`Selesaikan opname? Stok ${filledCount} bahan akan diperbarui sesuai qty fisik.`)) {
                  finishMutation.mutate()
                }
              }}
              disabled={finishMutation.isPending || filledCount === 0}
              className="btn-primary flex items-center gap-1.5 text-sm disabled:opacity-50"
            >
              {finishMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Selesaikan
            </button>
          </div>
        )}
      </div>

      {/* Progress */}
      {!isFinished && (
        <div className="bg-dough-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="font-body text-sm text-crust-600">
            <span className="font-semibold text-oven-800">{filledCount}</span> dari{' '}
            <span className="font-semibold">{opname.items.length}</span> bahan sudah diisi
          </p>
          <div className="w-24 h-2 bg-dough-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-crust-600 rounded-full transition-all"
              style={{ width: `${opname.items.length ? (filledCount / opname.items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {opname.items.map((item) => {
          const physVal = physicalQtys[item.id]
          const phys = physVal !== '' ? parseFloat(physVal) : null
          const diff = phys !== null ? phys - item.systemQty : null

          return (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-body text-sm font-semibold text-oven-800">{item.ingredient.name}</p>
                  <p className="font-body text-xs text-crust-400">
                    Sistem: <span className="font-semibold text-crust-600">{item.systemQty} {item.ingredient.baseUnit}</span>
                  </p>
                </div>

                {isFinished ? (
                  <div className="text-right">
                    <p className="font-body text-sm font-semibold text-oven-800">
                      {item.physicalQty ?? '—'} {item.ingredient.baseUnit}
                    </p>
                    {item.difference !== null && item.difference !== 0 && (
                      <p className={cn('font-body text-xs font-medium', item.difference > 0 ? 'text-green-600' : 'text-red-500')}>
                        {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {diff !== null && diff !== 0 && (
                      <span className={cn('font-body text-xs font-semibold', diff > 0 ? 'text-green-600' : 'text-red-500')}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                      </span>
                    )}
                    <div className="relative w-28">
                      <input
                        type="number"
                        value={physVal}
                        onChange={(e) => setPhysicalQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        min={0}
                        step={0.1}
                        placeholder={String(item.systemQty)}
                        className="input text-sm py-1.5 pr-8 text-right font-mono"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-crust-400">
                        {item.ingredient.baseUnit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

