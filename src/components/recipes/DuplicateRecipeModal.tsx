import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, X, Loader2, CheckCircle, ChevronDown } from 'lucide-react'
import { recipeApi, type ProductWithRecipe } from '../../services/recipeService'
import { productApi } from '../../services/productService'

interface DuplicateRecipeModalProps {
  product: ProductWithRecipe
  onClose: () => void
}

export default function DuplicateRecipeModal({ product, onClose }: DuplicateRecipeModalProps) {
  const recipe = product.recipe!
  const qc = useQueryClient()
  const [targetProductId, setTargetProductId] = useState('')
  const [done, setDone] = useState<{ targetName: string } | null>(null)

  // Get all products
  const { data: products = [] } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => productApi.list({ isActive: true }),
  })

  // Get all existing recipes to exclude products that already have one
  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipeApi.list,
  })

  const withRecipe = new Set(recipes.filter(r => r.recipe !== null).map(r => r.id))
  const available = products.filter(p => !withRecipe.has(p.id) && p.id !== product.id)

  const mutation = useMutation({
    mutationFn: () => recipeApi.duplicate(product.id, targetProductId || undefined),
    onSuccess: (data: { recipe: unknown; targetProduct: { id: string; name: string } }) => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      setDone({ targetName: data.targetProduct.name })
    },
  })

  const productName = product.name

  if (done) {
    return (
      <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-5 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-dark-800">Resep Berhasil Diduplikat</p>
            <p className="font-body text-sm text-muted-400 mt-1">
              Resep <strong>{productName}</strong> berhasil disalin ke <strong>{done.targetName}</strong>
            </p>
          </div>
          <button onClick={onClose} className="btn-primary w-full">Selesai</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary-600" />
            <h2 className="font-display text-base font-semibold text-dark-800">Duplikat Resep</h2>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
          {/* Source recipe info */}
          <div className="bg-surface-50 rounded-xl px-4 py-3">
            <p className="font-body text-xs text-muted-400 mb-0.5">Resep yang akan diduplikat</p>
            <p className="font-body text-sm font-semibold text-dark-800">{productName}</p>
            <p className="font-body text-xs text-muted-400 mt-0.5">
              {recipe.items.length} bahan · batch {recipe.batchSize} pcs
            </p>
          </div>

          {/* Target product selector */}
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
              Salin ke produk
            </label>
            {available.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="font-body text-sm text-amber-700">
                  Semua produk sudah memiliki resep. Tambah produk baru terlebih dahulu.
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <select
                    value={targetProductId}
                    onChange={(e) => setTargetProductId(e.target.value)}
                    className="input appearance-none pr-8"
                  >
                    <option value="">-- Pilih produk tujuan --</option>
                    {available.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400 pointer-events-none" />
                </div>
                <p className="font-body text-xs text-muted-400 mt-1">
                  {available.length} produk belum memiliki resep
                </p>
              </>
            )}
          </div>

          {mutation.isError && (
            <p className="font-body text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
              {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menduplikat resep.'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || available.length === 0 || !targetProductId}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Copy className="w-4 h-4" />
            }
            Duplikat
          </button>
        </div>
      </div>
    </div>
  )
}
