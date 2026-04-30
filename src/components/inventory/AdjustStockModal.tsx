import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Scale, X, Loader2 } from 'lucide-react'
import { stockApi } from '../../services/stockService'
import { cn } from '../../lib/utils'

interface Ingredient {
  id: string
  name: string
  baseUnit: string
  currentStock: number
}

interface AdjustStockModalProps {
  ingredient: Ingredient
  onClose: () => void
}

const REASONS = [
  'Koreksi hasil hitung fisik',
  'Stok rusak / expired',
  'Stok hilang',
  'Pembelian darurat tidak tercatat',
  'Lainnya',
]

export default function AdjustStockModal({ ingredient, onClose }: AdjustStockModalProps) {
  const qc = useQueryClient()
  const [newQty, setNewQty] = useState(String(ingredient.currentStock))
  const [reason, setReason] = useState(REASONS[0])
  const [customReason, setCustomReason] = useState('')

  const mutation = useMutation({
    mutationFn: () => stockApi.adjust({
      ingredientId: ingredient.id,
      newQty: parseFloat(newQty) || 0,
      reason: reason === 'Lainnya' ? customReason.trim() : reason,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      onClose()
    },
  })

  const newQtyNum = parseFloat(newQty) || 0
  const diff = newQtyNum - ingredient.currentStock
  const diffColor = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-muted-400'

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary-600" />
            <h2 className="font-display text-base font-semibold text-dark-800">Sesuaikan Stok</h2>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Ingredient info */}
          <div className="bg-surface-50 rounded-xl px-4 py-3">
            <p className="font-body text-sm font-semibold text-dark-800">{ingredient.name}</p>
            <p className="font-body text-xs text-muted-400 mt-0.5">
              Stok saat ini: <span className="font-semibold text-primary-600">{ingredient.currentStock} {ingredient.baseUnit}</span>
            </p>
          </div>

          {/* New qty */}
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
              Stok Fisik (hasil hitung)
            </label>
            <div className="relative">
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                min={0}
                step={0.1}
                className="input pr-20 font-mono"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">
                {ingredient.baseUnit}
              </span>
            </div>

            {/* Diff indicator */}
            {diff !== 0 && (
              <p className={cn('font-body text-xs mt-1.5 font-medium', diffColor)}>
                {diff > 0 ? '+' : ''}{diff.toFixed(1)} {ingredient.baseUnit}
                {diff > 0 ? ' (penambahan)' : ' (pengurangan)'}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
              Alasan Penyesuaian
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {reason === 'Lainnya' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Tulis alasan..."
                className="input mt-2"
              />
            )}
          </div>

          {mutation.isError && (
            <p className="font-body text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
              Gagal menyesuaikan stok. Coba lagi.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (reason === 'Lainnya' && !customReason.trim())}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan
          </button>
        </div>
      </div>
    </div>
  )
}

