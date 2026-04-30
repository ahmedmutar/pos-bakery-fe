import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, Loader2, ShoppingBag } from 'lucide-react'
import { inventoryApi } from '../../services/inventoryService'
import { formatCurrency } from '../../lib/utils'

interface PurchaseItem {
  ingredientId: string
  quantity: string
  unit: string
  unitFactor: string
  pricePerUnit: string
}

interface PurchaseModalProps {
  onClose: () => void
}

const emptyItem = (): PurchaseItem => ({
  ingredientId: '',
  quantity: '',
  unit: '',
  unitFactor: '1',
  pricePerUnit: '',
})

export default function PurchaseModal({ onClose }: PurchaseModalProps) {
  const qc = useQueryClient()
  const [items, setItems] = useState<PurchaseItem[]>([emptyItem()])
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => inventoryApi.ingredients(),
  })

  const updateItem = (index: number, field: keyof PurchaseItem, value: string) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      // Auto-fill unit from ingredient's baseUnit
      if (field === 'ingredientId') {
        const ing = ingredients.find((g) => g.id === value)
        if (ing) updated.unit = ing.baseUnit
      }
      return updated
    }))
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index))

  const totalCost = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseInt(item.pricePerUnit.replace(/\D/g, '')) || 0
    return sum + qty * price
  }, 0)

  const mutation = useMutation({
    mutationFn: () =>
      inventoryApi.createPurchase({
        date,
        notes: notes || undefined,
        items: items
          .filter((i) => i.ingredientId && i.quantity && i.pricePerUnit)
          .map((i) => ({
            ingredientId: i.ingredientId,
            quantity: parseFloat(i.quantity),
            unit: i.unit,
            unitFactor: parseFloat(i.unitFactor) || 1,
            pricePerUnit: parseInt(i.pricePerUnit.replace(/\D/g, '')),
          })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      qc.invalidateQueries({ queryKey: ['purchases'] })
      onClose()
    },
  })

  const isValid = items.some((i) => i.ingredientId && i.quantity && i.pricePerUnit)

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-600" />
            <h2 className="font-display text-lg font-semibold text-dark-800">Catat Pembelian</h2>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin">
          {/* Date & notes */}
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
              <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
                Catatan (opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nama supplier, dll..."
                className="input"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm font-medium text-primary-700">Daftar Bahan</p>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm font-body text-muted-500 hover:text-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah bahan
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const ingredient = ingredients.find((g) => g.id === item.ingredientId)
                return (
                  <div key={index} className="bg-surface-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-sm font-medium text-primary-600">Bahan #{index + 1}</p>
                      {items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="text-surface-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Ingredient select */}
                    <select
                      value={item.ingredientId}
                      onChange={(e) => updateItem(index, 'ingredientId', e.target.value)}
                      className="input text-sm bg-white"
                    >
                      <option value="">-- Pilih bahan --</option>
                      {ingredients.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Quantity */}
                      <div>
                        <label className="block text-xs font-body text-muted-500 mb-1">Jumlah</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.1"
                          className="input text-sm py-2 bg-white"
                        />
                      </div>

                      {/* Unit */}
                      <div>
                        <label className="block text-xs font-body text-muted-500 mb-1">
                          Satuan beli
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          placeholder={ingredient?.baseUnit ?? 'gram'}
                          className="input text-sm py-2 bg-white"
                        />
                      </div>

                      {/* Unit factor */}
                      <div>
                        <label className="block text-xs font-body text-muted-500 mb-1">
                          Konversi ke {ingredient?.baseUnit ?? 'satuan dasar'}
                        </label>
                        <input
                          type="number"
                          value={item.unitFactor}
                          onChange={(e) => updateItem(index, 'unitFactor', e.target.value)}
                          placeholder="1"
                          min="0.001"
                          step="0.001"
                          className="input text-sm py-2 bg-white"
                        />
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-body text-muted-500 mb-1">
                        Harga per {item.unit || ingredient?.baseUnit || 'satuan'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">Rp</span>
                        <input
                          type="text"
                          value={item.pricePerUnit}
                          onChange={(e) => updateItem(index, 'pricePerUnit', e.target.value.replace(/\D/g, ''))}
                          placeholder="0"
                          className="input pl-9 text-sm font-mono py-2 bg-white"
                        />
                      </div>

                      {/* Cost hint */}
                      {item.quantity && item.pricePerUnit && (
                        <p className="font-body text-xs text-muted-400 mt-1">
                          Subtotal: {formatCurrency(
                            (parseFloat(item.quantity) || 0) *
                            (parseInt(item.pricePerUnit.replace(/\D/g, '')) || 0)
                          )}
                          {item.unitFactor !== '1' && item.unit && ingredient && (
                            <> · {formatCurrency(
                              Math.round((parseInt(item.pricePerUnit.replace(/\D/g, '')) || 0) /
                              (parseFloat(item.unitFactor) || 1))
                            )} per {ingredient.baseUnit}</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          {totalCost > 0 && (
            <div className="flex justify-between items-center bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
              <span className="font-body text-sm font-medium text-primary-700">Total Pembelian</span>
              <span className="font-display text-lg font-semibold text-primary-700">
                {formatCurrency(totalCost)}
              </span>
            </div>
          )}

          {mutation.isError && (
            <p className="text-red-600 text-sm font-body bg-red-50 px-3 py-2 rounded-xl">
              Gagal menyimpan pembelian. Pastikan semua bahan terisi lengkap.
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
            Simpan Pembelian
          </button>
        </div>
      </div>
    </div>
  )
}
