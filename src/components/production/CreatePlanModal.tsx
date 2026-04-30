import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, Loader2, ChefHat } from 'lucide-react'
import { productionApi } from '../../services/productionService'
import { productApi } from '../../services/productService'
interface CreatePlanModalProps {
  onClose: () => void
  onSuccess: (planId: string) => void
}

interface PlanItemDraft {
  productId: string
  targetQty: string
}

export default function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const qc = useQueryClient()
  const today = new Date()
  const [date, setDate] = useState(today.toISOString().split('T')[0])
  const [time, setTime] = useState('06:00')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PlanItemDraft[]>([{ productId: '', targetQty: '' }])

  const { data: products = [] } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => productApi.list({ isActive: true }),
  })

  const usedIds = items.map((i) => i.productId).filter(Boolean)

  const updateItem = (index: number, field: keyof PlanItemDraft, value: string) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const mutation = useMutation({
    mutationFn: () =>
      productionApi.create({
        date: `${date}T${time}:00`,  // combine date + time
        notes: notes.trim() || undefined,
        items: items
          .filter((i) => i.productId && i.targetQty)
          .map((i) => ({
            productId: i.productId,
            targetQty: parseInt(i.targetQty),
          })),
      }),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['production'] })
      onSuccess(plan.id)
    },
  })

  const isValid = items.some((i) => i.productId && i.targetQty)

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary-600" />
            <h2 className="font-display text-lg font-semibold text-dark-800">Buat Rencana Produksi</h2>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">Jam Mulai</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan shift pagi, shift sore, dll..."
              className="input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm font-medium text-primary-700">Target produksi</p>
              <button
                onClick={() => setItems((prev) => [...prev, { productId: '', targetQty: '' }])}
                className="flex items-center gap-1.5 text-sm font-body text-muted-500 hover:text-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah produk
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    className="input text-sm flex-1"
                  >
                    <option value="">-- Pilih produk --</option>
                    {products
                      .filter((p) => !usedIds.includes(p.id) || p.id === item.productId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>

                  <div className="relative w-28 flex-shrink-0">
                    <input
                      type="number"
                      value={item.targetQty}
                      onChange={(e) => updateItem(index, 'targetQty', e.target.value)}
                      placeholder="0"
                      min="1"
                      className="input text-sm pr-10 text-center"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-xs text-muted-400">
                      pcs
                    </span>
                  </div>

                  {items.length > 1 && (
                    <button
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                      className="text-surface-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {mutation.isError && (
            <p className="text-red-600 text-sm font-body bg-red-50 px-3 py-2 rounded-xl">
              Gagal membuat rencana. Coba lagi.
            </p>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 border-t border-surface-200 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isValid}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Buat Rencana
          </button>
        </div>
      </div>
    </div>
  )
}
