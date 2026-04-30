import { SajiinIcon } from '../components/ui/SajiinLogo'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Pencil, Trash2, TrendingUp,
  Loader2, PackageX, ToggleLeft, ToggleRight, FileSpreadsheet } from 'lucide-react'
import { productApi, type Product } from '../services/productService'
import { categoryApi } from '../services/categoryService'
import { useAuthStore } from '../stores/authStore'
import { formatCurrency, cn } from '../lib/utils'
import ProductFormModal from '../components/products/ProductFormModal'
import ExcelImportModal from '../components/ui/ExcelImportModal'
import { useProductImport, PRODUCT_IMPORT_COLUMNS } from '../components/products/useProductImport'
import DeleteConfirmModal from '../components/products/DeleteConfirmModal'
import FoodCostDrawer from '../components/products/FoodCostDrawer'

type FilterStatus = 'all' | 'active' | 'inactive'

export default function ProductsPage() {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canEdit = user?.role === 'OWNER' || user?.role === 'PRODUCTION'
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const { importProducts } = useProductImport()
  const [editProduct, setEditProduct] = useState<Product | undefined>()
  const [deleteProduct, setDeleteProduct] = useState<Product | undefined>()
  const [foodCostProduct, setFoodCostProduct] = useState<Product | undefined>()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.list(),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  })

  const toggleActive = useMutation({
    mutationFn: (p: Product) => productApi.update(p.id, { isActive: !p.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setDeleteProduct(undefined)
    },
  })

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || p.categoryId === categoryFilter
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? p.isActive :
      !p.isActive
    return matchSearch && matchCategory && matchStatus
  })

  const activeCount = products.filter((p) => p.isActive).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-sm text-muted-400">
            {activeCount} produk aktif · {products.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Import Excel
          </button>
          {canEdit && (
            <button
              onClick={() => { setEditProduct(undefined); setShowForm(true) }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="input pl-9"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-auto min-w-36"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <div className="flex bg-surface-100 rounded-xl p-1 gap-1">
          {(['all', 'active', 'inactive'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all',
                statusFilter === s
                  ? 'bg-white text-dark-800 shadow-warm'
                  : 'text-muted-500 hover:text-primary-700'
              )}
            >
              {s === 'all' ? 'Semua' : s === 'active' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* Product table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-surface-300">
          <PackageX className="w-10 h-10" />
          <p className="font-body text-sm">Tidak ada produk ditemukan</p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="font-body text-sm text-muted-500 underline"
            >
              Reset pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="text-left px-5 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">
                  Produk
                </th>
                <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest hidden md:table-cell">
                  Kategori
                </th>
                <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">
                  Harga
                </th>
                <th className="text-center px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-4 py-3 w-36" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-surface-50 transition-colors group">
                  {/* Product name + image */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <SajiinIcon size={28} className="opacity-25" />
                        )}
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium text-dark-800">{product.name}</p>
                        {product.recipe && (
                          <p className="font-body text-xs text-muted-400">Ada resep</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {product.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-surface-100 text-primary-600">
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-surface-300 text-xs font-body">—</span>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-medium text-dark-800">
                      {formatCurrency(product.price)}
                    </span>
                  </td>

                  {/* Status toggle */}
                  <td className="px-4 py-3 text-center">
                    {canEdit ? (
                      <button
                        onClick={() => toggleActive.mutate(product)}
                        className="inline-flex items-center gap-1.5 transition-colors"
                      >
                        {product.isActive ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-green-500" />
                            <span className="font-body text-xs text-green-600 hidden sm:inline">Aktif</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-surface-300" />
                            <span className="font-body text-xs text-muted-400 hidden sm:inline">Nonaktif</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className={product.isActive ? 'text-green-500 text-xs font-body' : 'text-surface-300 text-xs font-body'}>
                        {product.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Food cost */}
                      <button
                        onClick={() => setFoodCostProduct(product)}
                        title="Lihat food cost"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-400
                                   hover:bg-surface-100 hover:text-primary-600 transition-colors"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => { setEditProduct(product); setShowForm(true) }}
                        title="Edit produk"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-400
                                   hover:bg-surface-100 hover:text-primary-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteProduct(product)}
                        title="Hapus produk"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-400
                                   hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ProductFormModal
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(undefined) }}
        />
      )}

      {deleteProduct && (
        <DeleteConfirmModal
          title="Hapus Produk"
          description={`Produk "${deleteProduct.name}" akan dinonaktifkan dan tidak tampil di kasir. Riwayat transaksi tetap tersimpan.`}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteProduct.id)}
          onClose={() => setDeleteProduct(undefined)}
        />
      )}

      {foodCostProduct && (
        <FoodCostDrawer
          productId={foodCostProduct.id}
          productName={foodCostProduct.name}
          onClose={() => setFoodCostProduct(undefined)}
        />
      )}
      {showImport && (
        <ExcelImportModal
          title="Import Produk dari Excel"
          columns={PRODUCT_IMPORT_COLUMNS}
          templateFilename="template-produk.xlsx"
          onImport={importProducts}
          onClose={() => setShowImport(false)}
          onSuccess={() => { setShowImport(false); qc.invalidateQueries({ queryKey: ['products'] }) }}
        />
      )}
    </div>
  )
}
