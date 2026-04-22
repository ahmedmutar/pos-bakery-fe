import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Trash2, Loader2, ChefHat } from 'lucide-react'
import { recipeApi, type ProductWithRecipe } from '../../services/recipeService'
import { inventoryApi } from '../../services/inventoryService'
import { formatCurrency, cn } from '../../lib/utils'

interface RecipeFormModalProps {
  product: ProductWithRecipe
  onClose: () => void
}

interface RecipeItemDraft {
  ingredientId: string
  amount: string
  unit: string
  unitFactor: string
}

const emptyItem = (): RecipeItemDraft => ({
  ingredientId: '',
  amount: '',
  unit: '',
  unitFactor: '1',
})

export default function RecipeFormModal({ product, onClose }: RecipeFormModalProps) {
  const qc = useQueryClient()
  const existing = product.recipe

  const [batchSize, setBatchSize] = useState(String(existing?.batchSize ?? 1))
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [instructions, setInstructions] = useState(existing?.instructions ?? '')
  const [items, setItems] = useState<RecipeItemDraft[]>(
    existing?.items.map((i) => ({
      ingredientId: i.ingredient.id,
      amount: String(i.amount),
      unit: i.unit,
      unitFactor: String(i.unitFactor),
    })) ?? [emptyItem()]
  )

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => inventoryApi.ingredients(),
  })

  const updateItem = (index: number, field: keyof RecipeItemDraft, value: string) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      if (field === 'ingredientId') {
        const ing = ingredients.find((g) => g.id === value)
        if (ing) updated.unit = ing.baseUnit
      }
      return updated
    }))
  }

  // Live food cost calculation
  const foodCost = items.reduce((sum, item) => {
    const ing = ingredients.find((g) => g.id === item.ingredientId)
    if (!ing) return sum
    const amount = parseFloat(item.amount) || 0
    const factor = parseFloat(item.unitFactor) || 1
    return sum + ing.currentPrice * amount * factor
  }, 0)

  const batch = parseInt(batchSize) || 1
  const costPerPcs = foodCost / batch
  const margin = product.price - costPerPcs
  const marginPct = product.price > 0 ? (margin / product.price) * 100 : 0

  const mutation = useMutation({
    mutationFn: () =>
      recipeApi.save(product.id, {
        batchSize: batch,
        notes: notes.trim() || undefined,
        instructions: instructions.trim() || undefined,
        items: items
          .filter((i) => i.ingredientId && i.amount)
          .map((i) => ({
            ingredientId: i.ingredientId,
            amount: parseFloat(i.amount),
            unit: i.unit,
            unitFactor: parseFloat(i.unitFactor) || 1,
          })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      onClose()
    },
  })

  const isValid = items.some((i) => i.ingredientId && i.amount)

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-crust-100 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-crust-600" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-oven-800">
                {existing ? 'Edit Resep' : 'Buat Resep'}
              </h2>
              <p className="font-body text-xs text-crust-400">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left — form */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin">
            {/* Batch size */}
            <div>
              <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
                Resep ini menghasilkan berapa pcs?
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(e.target.value)}
                  min="1"
                  className="input w-28 text-center font-mono text-lg"
                />
                <span className="font-body text-sm text-crust-500">pcs per batch</span>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-body font-medium text-crust-700">
                  Bahan-bahan
                </label>
                <button
                  onClick={() => setItems((prev) => [...prev, emptyItem()])}
                  className="flex items-center gap-1.5 text-sm font-body text-crust-500 hover:text-crust-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tambah bahan
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const ing = ingredients.find((g) => g.id === item.ingredientId)
                  return (
                    <div key={index} className="bg-dough-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <select
                          value={item.ingredientId}
                          onChange={(e) => updateItem(index, 'ingredientId', e.target.value)}
                          className="input text-sm bg-white flex-1 mr-3"
                        >
                          <option value="">-- Pilih bahan --</option>
                          {ingredients.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                          className="text-crust-300 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Amount */}
                        <div>
                          <label className="block text-xs font-body text-crust-500 mb-1">Jumlah</label>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => updateItem(index, 'amount', e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.1"
                            className="input text-sm py-2 bg-white"
                          />
                        </div>

                        {/* Unit */}
                        <div>
                          <label className="block text-xs font-body text-crust-500 mb-1">Satuan</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            placeholder={ing?.baseUnit ?? 'gram'}
                            className="input text-sm py-2 bg-white"
                          />
                        </div>

                        {/* Unit factor */}
                        <div>
                          <label className="block text-xs font-body text-crust-500 mb-1">
                            ke {ing?.baseUnit ?? 'satuan dasar'}
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

                      {/* Cost contribution */}
                      {ing && item.amount && (
                        <div className="flex justify-between font-body text-xs text-crust-400">
                          <span>
                            {item.amount} {item.unit}
                            {item.unitFactor !== '1' && ` = ${(parseFloat(item.amount) * parseFloat(item.unitFactor)).toFixed(1)} ${ing.baseUnit}`}
                          </span>
                          <span className="text-crust-600 font-medium">
                            {formatCurrency(
                              ing.currentPrice *
                              (parseFloat(item.amount) || 0) *
                              (parseFloat(item.unitFactor) || 1)
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
                Catatan Singkat (opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tips, suhu oven, waktu pengembangan adonan..."
                className="input resize-none h-16 text-sm"
              />
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
                Instruksi Pembuatan (opsional)
              </label>
              <p className="font-body text-xs text-crust-400 mb-2">
                Tulis langkah-langkah pembuatan secara rinci. Gunakan angka (1. 2. 3.) atau enter untuk tiap langkah.
              </p>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={`1. Campur tepung, gula, dan garam dalam wadah besar.\n2. Larutkan ragi dalam air hangat, diamkan 5 menit.\n3. Masukkan mentega dan uleni hingga kalis...`}
                className="input resize-none text-sm font-body leading-relaxed"
                rows={8}
              />
            </div>

            {mutation.isError && (
              <p className="text-red-600 text-sm font-body bg-red-50 px-3 py-2 rounded-xl">
                Gagal menyimpan resep. Pastikan semua bahan terisi.
              </p>
            )}
          </div>

          {/* Right — live food cost summary */}
          <div className="w-56 flex-shrink-0 border-l border-dough-100 px-5 py-5 space-y-4 bg-dough-50">
            <p className="font-body text-sm font-medium text-crust-700">Kalkulasi live</p>

            <div className="space-y-3">
              <div>
                <p className="font-body text-xs text-crust-400">Total biaya batch</p>
                <p className="font-display text-lg font-semibold text-oven-800">
                  {formatCurrency(Math.round(foodCost))}
                </p>
              </div>

              <div>
                <p className="font-body text-xs text-crust-400">Biaya per pcs</p>
                <p className="font-display text-base font-semibold text-oven-800">
                  {formatCurrency(Math.round(costPerPcs))}
                </p>
              </div>

              <div className="border-t border-dough-200 pt-3">
                <p className="font-body text-xs text-crust-400">Harga jual</p>
                <p className="font-body text-sm font-medium text-oven-700">
                  {formatCurrency(product.price)}
                </p>
              </div>

              <div>
                <p className="font-body text-xs text-crust-400 mb-1">Margin</p>
                <p className={cn(
                  'font-display text-xl font-bold',
                  marginPct >= 30 ? 'text-green-600' :
                  marginPct >= 10 ? 'text-amber-500' : 'text-red-500'
                )}>
                  {Math.round(marginPct)}%
                </p>
                <div className="w-full h-1.5 bg-dough-200 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      marginPct >= 30 ? 'bg-green-500' :
                      marginPct >= 10 ? 'bg-amber-400' : 'bg-red-400'
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
                  />
                </div>
                <p className={cn(
                  'font-body text-xs mt-1',
                  marginPct >= 30 ? 'text-green-600' :
                  marginPct >= 10 ? 'text-amber-500' : 'text-red-500'
                )}>
                  {margin >= 0
                    ? `+${formatCurrency(Math.round(margin))} / pcs`
                    : `${formatCurrency(Math.round(margin))} / pcs`}
                </p>
              </div>

              {foodCost === 0 && (
                <p className="font-body text-xs text-crust-400 italic">
                  Tambah bahan untuk melihat kalkulasi
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-dough-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isValid}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Resep
          </button>
        </div>
      </div>
    </div>
  )
}
