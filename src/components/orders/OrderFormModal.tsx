import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, Loader2, ClipboardList } from 'lucide-react'
import { preOrderApi } from '../../services/preOrderService'
import { productApi } from '../../services/productService'
import { formatCurrency, cn } from '../../lib/utils'

interface OrderFormModalProps {
  onClose: () => void
}

interface OrderItemDraft {
  productId: string
  quantity: string
  unitPrice: string
  customNotes: string
}

const emptyItem = (): OrderItemDraft => ({
  productId: '',
  quantity: '1',
  unitPrice: '',
  customNotes: '',
})

export default function OrderFormModal({ onClose }: OrderFormModalProps) {
  const qc = useQueryClient()

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('10:00')
  const [dpAmount, setDpAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderItemDraft[]>([emptyItem()])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => productApi.list({ isActive: true }),
  })

  const updateItem = (index: number, field: keyof OrderItemDraft, value: string) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      if (field === 'productId') {
        const product = products.find((p) => p.id === value)
        if (product) updated.unitPrice = String(product.price)
      }
      return updated
    }))
  }

  const subtotal = items.reduce((sum, item) => {
    const qty = parseInt(item.quantity) || 1 || 0
    const price = parseInt(item.unitPrice.replace(/\D/g, '')) || 0
    return sum + qty * price
  }, 0)

  const dp = parseInt(dpAmount.replace(/\D/g, '')) || 0
  const remaining = subtotal - dp

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!customerName.trim()) errs.customerName = 'Nama pelanggan wajib diisi'
    if (!customerPhone.trim()) errs.customerPhone = 'Nomor HP wajib diisi'
    if (!pickupDate) errs.pickupDate = 'Tanggal pengambilan wajib diisi'
    if (!items.some((i) => i.productId && i.quantity)) errs.items = 'Minimal satu produk harus diisi'
    if (dp > subtotal) errs.dpAmount = 'DP tidak boleh melebihi total'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const mutation = useMutation({
    mutationFn: () =>
      preOrderApi.create({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        pickupDate: `${pickupDate}T${pickupTime}:00`,
        dpAmount: dp || undefined,
        notes: notes.trim() || undefined,
        items: items
          .filter((i) => i.productId && i.quantity)
          .map((i) => ({
            productId: i.productId,
            quantity: parseInt(i.quantity),
            unitPrice: parseInt(i.unitPrice.replace(/\D/g, '')),
            customNotes: i.customNotes.trim() || undefined,
          })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pre-orders'] })
      onClose()
    },
  })

  const handleSave = () => {
    if (validate()) mutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary-600" />
            <h2 className="font-display text-lg font-semibold text-dark-800">Buat Pesanan Baru</h2>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin">
          {/* Customer info */}
          <div>
            <p className="font-body text-sm font-semibold text-dark-800 mb-3">Data Pelanggan</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
                  Nama <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama pelanggan"
                  className={cn('input text-sm', errors.customerName && 'border-red-300')}
                  autoFocus
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
                  Nomor HP <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={cn('input text-sm', errors.customerPhone && 'border-red-300')}
                />
                {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone}</p>}
              </div>
            </div>
          </div>

          {/* Pickup date */}
          <div>
            <p className="font-body text-sm font-semibold text-dark-800 mb-3">Waktu Pengambilan</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
                  Tanggal <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={cn('input text-sm', errors.pickupDate && 'border-red-300')}
                />
                {errors.pickupDate && <p className="text-red-500 text-xs mt-1">{errors.pickupDate}</p>}
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">Jam</label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="input text-sm"
                />
              </div>
            </div>
          </div>

          {/* Order items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm font-semibold text-dark-800">Produk Dipesan</p>
              <button
                onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="flex items-center gap-1.5 text-sm font-body text-muted-500 hover:text-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah produk
              </button>
            </div>

            {errors.items && (
              <p className="text-red-500 text-xs mb-2">{errors.items}</p>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="bg-surface-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="input text-sm bg-white flex-1"
                    >
                      <option value="">-- Pilih produk --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {items.length > 1 && (
                      <button
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                        className="text-surface-300 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-body text-muted-500 mb-1">Jumlah</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          min="1"
                          className="input text-sm py-2 bg-white pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-xs text-muted-400">pcs</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-body text-muted-500 mb-1">Harga satuan</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-xs text-muted-400">Rp</span>
                        <input
                          type="text"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value.replace(/\D/g, ''))}
                          className="input text-sm py-2 bg-white pl-8 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-body text-muted-500 mb-1">
                      Catatan kustom (tulisan di kue, warna, dll)
                    </label>
                    <input
                      type="text"
                      value={item.customNotes}
                      onChange={(e) => updateItem(index, 'customNotes', e.target.value)}
                      placeholder="Contoh: Tulis 'Happy Birthday Rina'"
                      className="input text-sm py-2 bg-white"
                    />
                  </div>

                  {item.productId && item.quantity && item.unitPrice && (
                    <div className="flex justify-end">
                      <span className="font-body text-sm font-semibold text-primary-700">
                        {formatCurrency((parseInt(item.quantity) || 1 || 0) * (parseInt(item.unitPrice.replace(/\D/g, '')) || 0))}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary */}
          {subtotal > 0 && (
            <div className="bg-surface-50 rounded-xl p-4 space-y-3">
              <p className="font-body text-sm font-semibold text-dark-800">Pembayaran</p>

              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-500">Total pesanan</span>
                <span className="font-semibold text-dark-800">{formatCurrency(subtotal)}</span>
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
                  Uang muka (DP)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">Rp</span>
                  <input
                    type="text"
                    value={dpAmount}
                    onChange={(e) => setDpAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className={cn('input pl-9 font-mono', errors.dpAmount && 'border-red-300')}
                  />
                </div>
                {errors.dpAmount && <p className="text-red-500 text-xs mt-1">{errors.dpAmount}</p>}

                {/* Quick DP buttons */}
                <div className="flex gap-2 mt-2">
                  {[0.3, 0.5, 1].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDpAmount(String(Math.round(subtotal * pct)))}
                      className="flex-1 py-1.5 rounded-lg text-xs font-body font-medium border
                                 bg-white text-primary-600 border-surface-200 hover:bg-surface-100 transition-all"
                    >
                      {pct === 1 ? 'Lunas' : `${pct * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              {dp > 0 && (
                <div className="flex justify-between font-body text-sm border-t border-surface-200 pt-2">
                  <span className="text-muted-500">Sisa pelunasan</span>
                  <span className={cn(
                    'font-semibold',
                    remaining === 0 ? 'text-green-600' : 'text-dark-800'
                  )}>
                    {remaining === 0 ? 'Lunas ✓' : formatCurrency(remaining)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
              Catatan tambahan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan khusus untuk tim produksi..."
              className="input resize-none h-20 text-sm"
            />
          </div>

          {mutation.isError && (
            <p className="text-red-600 text-sm font-body bg-red-50 px-3 py-2 rounded-xl">
              Gagal membuat pesanan. Coba lagi.
            </p>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 border-t border-surface-200 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Buat Pesanan
          </button>
        </div>
      </div>
    </div>
  )
}
