import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2, ClipboardCheck } from 'lucide-react'
import { inventoryApi, type Ingredient } from '../../services/inventoryService'
import { cn } from '../../lib/utils'

interface StockAdjustModalProps {
  ingredient: Ingredient
  onClose: () => void
}

export default function StockAdjustModal({ ingredient, onClose }: StockAdjustModalProps) {
  const qc = useQueryClient()
  const [actualStock, setActualStock] = useState(String(ingredient.currentStock))
  const [notes, setNotes] = useState('')

  const actual = parseFloat(actualStock) || 0
  const diff = actual - ingredient.currentStock
  const diffLabel =
    diff === 0 ? null :
    diff > 0 ? `+${diff} ${ingredient.baseUnit} (stok bertambah)` :
    `${diff} ${ingredient.baseUnit} (stok berkurang)`

  const mutation = useMutation({
    mutationFn: () => inventoryApi.adjustStock(ingredient.id, actual, notes || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="font-display text-base font-semibold text-dark-800">Stok Opname</h2>
              <p className="font-body text-xs text-muted-400">{ingredient.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-surface-50 rounded-xl px-4 py-3 flex justify-between">
            <span className="font-body text-sm text-muted-500">Stok sistem saat ini</span>
            <span className="font-body text-sm font-semibold text-dark-800">
              {ingredient.currentStock} {ingredient.baseUnit}
            </span>
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
              Stok aktual (hasil hitung fisik)
            </label>
            <div className="relative">
              <input
                type="number"
                value={actualStock}
                onChange={(e) => setActualStock(e.target.value)}
                min="0"
                step="0.1"
                className="input pr-16"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">
                {ingredient.baseUnit}
              </span>
            </div>

            {diffLabel && (
              <p className={cn(
                'font-body text-xs mt-1.5',
                diff > 0 ? 'text-green-600' : 'text-red-500'
              )}>
                {diffLabel}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alasan penyesuaian stok..."
              className="input resize-none h-20 text-sm"
            />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || actual === ingredient.currentStock}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Opname
          </button>
        </div>
      </div>
    </div>
  )
}
