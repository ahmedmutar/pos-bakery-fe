import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Pencil, ClipboardCheck, ShoppingBag,
  Loader2, AlertTriangle, Package, History, FileSpreadsheet,
} from 'lucide-react'
import { inventoryApi, type Ingredient, type IngredientType } from '../services/inventoryService'
import { formatCurrency, cn } from '../lib/utils'
import IngredientFormModal from '../components/inventory/IngredientFormModal'
import ExcelImportModal from '../components/ui/ExcelImportModal'
import { useInventoryImport, INVENTORY_IMPORT_COLUMNS } from '../components/inventory/useInventoryImport'
import StockAdjustModal from '../components/inventory/StockAdjustModal'
import PurchaseModal from '../components/inventory/PurchaseModal'
import DeleteConfirmModal from '../components/products/DeleteConfirmModal'

type Tab = 'ingredients' | 'purchases'


const TYPE_CONFIG = {
  INGREDIENT: { label: 'Bahan Baku', color: 'bg-surface-100 text-primary-700' },
  EQUIPMENT:  { label: 'Alat',       color: 'bg-blue-100 text-blue-700' },
  PACKAGING:  { label: 'Kemasan',    color: 'bg-purple-100 text-purple-700' },
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.INGREDIENT
  return (
    <span className={cn('text-[10px] font-body font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md', cfg.color)}>
      {cfg.label}
    </span>
  )
}

export default function InventoryPage() {
  const qc = useQueryClient()
  const { t } = useTranslation()
    const [tab, setTab] = useState<Tab>('ingredients')
  const [search, setSearch] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)
  const [ingredientType, setIngredientType] = useState<IngredientType | 'ALL'>('ALL')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const { importIngredients } = useInventoryImport()
  const [editIngredient, setEditIngredient] = useState<Ingredient | undefined>()
  const [adjustIngredient, setAdjustIngredient] = useState<Ingredient | undefined>()
  const [deleteIngredient, setDeleteIngredient] = useState<Ingredient | undefined>()
  const [showPurchase, setShowPurchase] = useState(false)

  const { data: ingredients = [], isLoading: loadingIngredients } = useQuery({
    queryKey: ['ingredients', ingredientType],
    queryFn: () => ingredientType === 'ALL' ? inventoryApi.ingredients() : inventoryApi.ingredients(ingredientType as 'INGREDIENT' | 'EQUIPMENT' | 'PACKAGING'),
  })

  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ['purchases'],
    queryFn: inventoryApi.purchases,
    enabled: tab === 'purchases',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.updateIngredient(id, { minimumStock: -1 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      setDeleteIngredient(undefined)
    },
  })

  const lowStockCount = ingredients.filter((i) => i.currentStock <= i.minimumStock && i.minimumStock > 0).length

  const countByType = {
    ALL: ingredients.length,
    INGREDIENT: ingredients.filter((i) => i.type === 'INGREDIENT').length,
    EQUIPMENT: ingredients.filter((i) => i.type === 'EQUIPMENT').length,
    PACKAGING: ingredients.filter((i) => i.type === 'PACKAGING').length,
  }

  const filtered = ingredients.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    const matchLow = showLowOnly ? i.currentStock <= i.minimumStock : true
    return matchSearch && matchLow
  })

  const stockPercent = (ingredient: Ingredient) => {
    if (ingredient.minimumStock === 0) return 100
    return Math.min(100, (ingredient.currentStock / (ingredient.minimumStock * 2)) * 100)
  }

  const stockStatus = (ingredient: Ingredient) => {
    if (ingredient.minimumStock === 0) return 'ok'
    if (ingredient.currentStock <= 0) return 'empty'
    if (ingredient.currentStock <= ingredient.minimumStock) return 'low'
    return 'ok'
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="font-body text-sm text-amber-700">
                {lowStockCount} bahan stok menipis
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPurchase(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Catat Pembelian
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Import Excel
          </button>
          <button
            onClick={() => { setEditIngredient(undefined); setShowForm(true) }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Bahan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-100 rounded-xl p-1 gap-1 w-fit">
        {([
          { key: 'ingredients', label: t('inventory.title'), icon: Package },
          { key: 'purchases', label: 'Riwayat Pembelian', icon: History },
        ] as { key: Tab; label: string; icon: typeof Package }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all',
              tab === key
                ? 'bg-white text-dark-800 shadow-warm'
                : 'text-muted-500 hover:text-primary-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Ingredients tab */}
      {tab === 'ingredients' && (
        <>
          {/* Type tabs */}
          <div className="flex gap-2 flex-wrap">
            {([
              { key: 'ALL' as const,        label: 'Semua' },
              { key: 'INGREDIENT' as const, label: 'Bahan Baku' },
              { key: 'EQUIPMENT' as const,  label: 'Alat' },
              { key: 'PACKAGING' as const,  label: 'Kemasan' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setIngredientType(key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium border transition-all',
                  ingredientType === key
                    ? 'bg-primary-600 text-white border-primary-600 shadow-warm'
                    : 'bg-white text-primary-600 border-surface-200 hover:bg-surface-50'
                )}
              >
                {label}
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  ingredientType === key ? 'bg-white/20 text-white' : 'bg-surface-100 text-muted-500'
                )}>
                  {countByType[key]}
                </span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari bahan..."
                className="input pl-9"
              />
            </div>
            <button
              onClick={() => setShowLowOnly(!showLowOnly)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium border transition-all',
                showLowOnly
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-primary-600 border-surface-200 hover:bg-surface-50'
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              Stok menipis saja
            </button>
          </div>

          {loadingIngredients ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-surface-300">
              <Package className="w-10 h-10" />
              <p className="font-body text-sm">Belum ada bahan baku</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="text-left px-5 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">
                      Bahan
                    </th>
                    <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest hidden lg:table-cell">
                      Stok
                    </th>
                    <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest hidden md:table-cell">
                      Harga/satuan
                    </th>
                    <th className="px-4 py-3 w-32" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {filtered.map((ingredient) => {
                    const status = stockStatus(ingredient)
                    const pct = stockPercent(ingredient)
                    return (
                      <tr key={ingredient.id} className="hover:bg-surface-50 transition-colors group">
                        {/* Name + status */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              status === 'empty' ? 'bg-red-500' :
                              status === 'low' ? 'bg-amber-400' : 'bg-green-400'
                            )} />
                            <div>
                              <p className="font-body text-sm font-medium text-dark-800">
                                {ingredient.name}
                              </p>
                              <p className="font-body text-xs text-muted-400">
                                Satuan: {ingredient.baseUnit}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Type badge */}
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <TypeBadge type={ingredient.type} />
                          {ingredient.notes && (
                            <p className="font-body text-[10px] text-muted-400 mt-1 truncate max-w-28">{ingredient.notes}</p>
                          )}
                        </td>

                        {/* Stock bar */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="min-w-32">
                            <div className="flex justify-between font-body text-xs mb-1">
                              <span className={cn(
                                'font-medium',
                                status === 'empty' ? 'text-red-600' :
                                status === 'low' ? 'text-amber-600' : 'text-dark-700'
                              )}>
                                {ingredient.currentStock} {ingredient.baseUnit}
                              </span>
                              {ingredient.minimumStock > 0 && (
                                <span className="text-muted-400">
                                  min {ingredient.minimumStock}
                                </span>
                              )}
                            </div>
                            <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  status === 'empty' ? 'bg-red-400' :
                                  status === 'low' ? 'bg-amber-400' : 'bg-green-400'
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className="font-body text-sm text-dark-700">
                            {ingredient.currentPrice > 0
                              ? `${formatCurrency(ingredient.currentPrice)} / ${ingredient.baseUnit}`
                              : <span className="text-surface-300">—</span>
                            }
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setAdjustIngredient(ingredient)}
                              title="Stok opname"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-400
                                         hover:bg-surface-100 hover:text-primary-600 transition-colors"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditIngredient(ingredient); setShowForm(true) }}
                              title="Edit bahan"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-400
                                         hover:bg-surface-100 hover:text-primary-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Purchases tab */}
      {tab === 'purchases' && (
        <>
          {loadingPurchases ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-surface-300">
              <History className="w-10 h-10" />
              <p className="font-body text-sm">Belum ada riwayat pembelian</p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase: {
                id: string
                date: string
                notes: string | null
                supplier: { name: string } | null
                items: {
                  ingredient: { name: string; baseUnit: string }
                  quantity: number
                  unit: string
                  pricePerUnit: number
                }[]
              }) => (
                <div key={purchase.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-body text-sm font-medium text-dark-800">
                        {new Date(purchase.date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                      {purchase.supplier && (
                        <p className="font-body text-xs text-muted-400">{purchase.supplier.name}</p>
                      )}
                      {purchase.notes && (
                        <p className="font-body text-xs text-muted-400 mt-0.5">{purchase.notes}</p>
                      )}
                    </div>
                    <span className="font-display text-base font-semibold text-primary-600">
                      {formatCurrency(
                        purchase.items.reduce((sum: number, i: typeof purchase.items[number]) =>
                          sum + i.quantity * i.pricePerUnit, 0)
                      )}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {purchase.items.map((item: typeof purchase.items[number], i: number) => (
                      <div key={i} className="flex justify-between text-sm font-body">
                        <span className="text-dark-700">{item.ingredient.name}</span>
                        <div className="flex items-center gap-4 text-muted-500">
                          <span>{item.quantity} {item.unit}</span>
                          <span>{formatCurrency(item.pricePerUnit)} / {item.unit}</span>
                          <span className="font-medium text-dark-700">
                            {formatCurrency(item.quantity * item.pricePerUnit)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showForm && (
        <IngredientFormModal
          ingredient={editIngredient}
          onClose={() => { setShowForm(false); setEditIngredient(undefined) }}
        />
      )}

      {adjustIngredient && (
        <StockAdjustModal
          ingredient={adjustIngredient}
          onClose={() => setAdjustIngredient(undefined)}
        />
      )}

      {showPurchase && (
        <PurchaseModal onClose={() => setShowPurchase(false)} />
      )}

      {deleteIngredient && (
        <DeleteConfirmModal
          title="Hapus Bahan"
          description={`Bahan "${deleteIngredient.name}" akan dihapus dari daftar. Resep yang menggunakan bahan ini mungkin terpengaruh.`}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteIngredient.id)}
          onClose={() => setDeleteIngredient(undefined)}
        />
      )}

      {showImport && (
        <ExcelImportModal
          title="Import Inventaris dari Excel"
          columns={INVENTORY_IMPORT_COLUMNS}
          templateFilename="template-inventaris.xlsx"
          onImport={importIngredients}
          onClose={() => setShowImport(false)}
          onSuccess={() => setShowImport(false)}
        />
      )}
    </div>
  )
}