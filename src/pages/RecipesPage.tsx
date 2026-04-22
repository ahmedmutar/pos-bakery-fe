import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChefHat, Search, Plus, Pencil, Trash2,
  Loader2, BookOpen, TrendingUp, TrendingDown, FileSpreadsheet } from 'lucide-react'
import { recipeApi, type ProductWithRecipe } from '../services/recipeService'
import { formatCurrency, cn } from '../lib/utils'
import RecipeFormModal from '../components/recipes/RecipeFormModal'
import ExcelImportModal from '../components/ui/ExcelImportModal'
import { useRecipeImport, RECIPE_IMPORT_COLUMNS } from '../components/recipes/useRecipeImport'
import DeleteConfirmModal from '../components/products/DeleteConfirmModal'

type FilterRecipe = 'all' | 'has_recipe' | 'no_recipe'

export default function RecipesPage() {
  const qc = useQueryClient()
  const [showImport, setShowImport] = useState(false)
  const { importRecipes } = useRecipeImport()
    const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterRecipe>('all')
  const [editProduct, setEditProduct] = useState<ProductWithRecipe | undefined>()
  const [deleteProduct, setDeleteProduct] = useState<ProductWithRecipe | undefined>()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipeApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => recipeApi.remove(productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] })
      setDeleteProduct(undefined)
    },
  })

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true :
      filter === 'has_recipe' ? !!p.recipe :
      !p.recipe
    return matchSearch && matchFilter
  })

  const withRecipe = products.filter((p) => p.recipe).length

  // Calculate margin for a product
  const getMargin = (product: ProductWithRecipe) => {
    if (!product.recipe) return null
    const cost = product.recipe.items.reduce((sum, item) => {
      return sum + item.ingredient.currentPrice * item.amount * item.unitFactor
    }, 0)
    const costPerPcs = cost / product.recipe.batchSize
    const margin = product.price - costPerPcs
    const marginPct = product.price > 0 ? (margin / product.price) * 100 : 0
    return { costPerPcs: Math.round(costPerPcs), margin: Math.round(margin), marginPct: Math.round(marginPct) }
  }

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
        <div className="card">
          <p className="font-body text-sm text-crust-500">Total produk</p>
          <p className="font-display text-2xl font-semibold text-oven-800 mt-1">{products.length}</p>
        </div>
        <div className="card">
          <p className="font-body text-sm text-crust-500">Sudah ada resep</p>
          <p className="font-display text-2xl font-semibold text-green-700 mt-1">{withRecipe}</p>
        </div>
        <div className="card">
          <p className="font-body text-sm text-crust-500">Belum ada resep</p>
          <p className="font-display text-2xl font-semibold text-amber-600 mt-1">
            {products.length - withRecipe}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-crust-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="input pl-9"
          />
        </div>

        <div className="flex bg-dough-100 rounded-xl p-1 gap-1">
          {([
            { key: 'all', label: 'Semua' },
            { key: 'has_recipe', label: 'Ada resep' },
            { key: 'no_recipe', label: 'Belum ada' },
          ] as { key: FilterRecipe; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all',
                filter === key
                  ? 'bg-white text-oven-800 shadow-warm'
                  : 'text-crust-500 hover:text-crust-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowImport(true)}
          className="btn-secondary flex items-center gap-2 ml-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Import Excel
        </button>
      </div>

      {/* Product list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-crust-300">
          <BookOpen className="w-10 h-10" />
          <p className="font-body text-sm">Tidak ada produk ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => {
            const margin = getMargin(product)
            return (
              <div
                key={product.id}
                className="card hover:border-crust-300 transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Product image */}
                  <div className="w-12 h-12 rounded-xl bg-dough-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🥐</span>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-semibold text-oven-800">{product.name}</p>
                        {product.category && (
                          <p className="font-body text-xs text-crust-400">{product.category.name}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {product.recipe ? (
                          <>
                            <button
                              onClick={() => setEditProduct(product)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body
                                         font-medium text-crust-600 hover:bg-dough-100 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit resep
                            </button>
                            <button
                              onClick={() => setDeleteProduct(product)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center
                                         text-crust-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditProduct(product)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body
                                       font-medium bg-crust-600 text-cream hover:bg-crust-700 transition-colors shadow-warm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Buat resep
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Recipe summary */}
                    {product.recipe ? (
                      <div className="mt-3 space-y-2">
                        {/* Ingredient chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {product.recipe.items.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-body
                                         bg-dough-100 text-crust-600 border border-dough-200"
                            >
                              {item.ingredient.name}
                              <span className="ml-1 text-crust-400">
                                {item.amount} {item.unit}
                              </span>
                            </span>
                          ))}
                        </div>

                        {/* Margin summary */}
                        {margin && (
                          <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-1.5">
                              <ChefHat className="w-3.5 h-3.5 text-crust-400" />
                              <span className="font-body text-xs text-crust-500">
                                {product.recipe.batchSize} pcs / batch ·
                                biaya {formatCurrency(margin.costPerPcs)} / pcs
                              </span>
                            </div>

                            <div className={cn(
                              'flex items-center gap-1 ml-auto',
                              margin.marginPct >= 30 ? 'text-green-600' :
                              margin.marginPct >= 10 ? 'text-amber-500' : 'text-red-500'
                            )}>
                              {margin.marginPct >= 0
                                ? <TrendingUp className="w-3.5 h-3.5" />
                                : <TrendingDown className="w-3.5 h-3.5" />
                              }
                              <span className="font-body text-xs font-semibold">
                                Margin {margin.marginPct}%
                              </span>
                              <span className="font-body text-xs">
                                ({formatCurrency(margin.margin)} / pcs)
                              </span>
                            </div>
                          </div>
                        )}

                        {product.recipe.notes && (
                          <p className="font-body text-xs text-crust-400 italic mt-2">
                            {product.recipe.notes}
                          </p>
                        )}

                        {product.recipe.instructions && (
                          <div className="mt-3 border-t border-dough-100 pt-3">
                            <p className="font-body text-xs font-semibold text-crust-600 uppercase tracking-widest mb-2">
                              Instruksi Pembuatan
                            </p>
                            <div className="font-body text-sm text-oven-700 whitespace-pre-line leading-relaxed bg-dough-50 rounded-xl px-4 py-3">
                              {product.recipe.instructions}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="font-body text-xs text-crust-300 mt-2 italic">
                        Belum ada resep — food cost tidak dapat dihitung
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {editProduct && (
        <RecipeFormModal
          product={editProduct}
          onClose={() => setEditProduct(undefined)}
        />
      )}

      {deleteProduct && (
        <DeleteConfirmModal
          title="Hapus Resep"
          description={`Resep untuk "${deleteProduct.name}" akan dihapus. Produk tetap ada, hanya kalkulasi food cost yang tidak tersedia.`}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteProduct.id)}
          onClose={() => setDeleteProduct(undefined)}
        />
      )}
      {showImport && (
        <ExcelImportModal
          title="Import Resep dari Excel"
          columns={RECIPE_IMPORT_COLUMNS}
          templateFilename="template-resep.xlsx"
          onImport={importRecipes}
          onClose={() => setShowImport(false)}
          onSuccess={() => setShowImport(false)}
        />
      )}
    </div>
  )
}