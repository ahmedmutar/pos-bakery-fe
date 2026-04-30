import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, ImagePlus, Loader2 } from 'lucide-react'
import { productApi, type Product } from '../../services/productService'
import { categoryApi } from '../../services/categoryService'
import { formatCurrency, cn } from '../../lib/utils'

interface ProductFormModalProps {
  product?: Product
  onClose: () => void
}

export default function ProductFormModal({ product, onClose }: ProductFormModalProps) {
  const qc = useQueryClient()
  const isEdit = !!product

  const [name, setName] = useState(product?.name ?? '')
  const [price, setPrice] = useState(product?.price ? String(product.price) : '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '')
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.list,
  })

  const createCategory = useMutation({
    mutationFn: () => categoryApi.create(newCategory.trim()),
    onSuccess: (cat) => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      setCategoryId(cat.id)
      setNewCategory('')
      setShowNewCategory(false)
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        price: parseInt(price.replace(/\D/g, '')) || 0,
        categoryId: categoryId || undefined,
        imageUrl: imageUrl.trim() || undefined,
      }
      return isEdit
        ? productApi.update(product.id, payload)
        : productApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
  })

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Nama produk wajib diisi'
    const priceNum = parseInt(price.replace(/\D/g, ''))
    if (!priceNum || priceNum <= 0) errs.price = 'Harga harus lebih dari 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (validate()) saveMutation.mutate()
  }

  const priceDisplay = price
    ? formatCurrency(parseInt(price.replace(/\D/g, '')) || 0)
    : ''

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-dark-800">
            {isEdit ? 'Edit Produk' : 'Tambah Produk'}
          </h2>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4 scrollbar-thin">
          {/* Image preview */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-surface-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-7 h-7 text-surface-300" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
                URL Gambar (opsional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="input text-sm"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
              Nama Produk <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Croissant Butter"
              className={cn('input', errors.name && 'border-red-300 focus:ring-red-300')}
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 font-body">{errors.name}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
              Harga Jual <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">
                Rp
              </span>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className={cn('input pl-9 font-mono', errors.price && 'border-red-300 focus:ring-red-300')}
              />
            </div>
            {price && !errors.price && (
              <p className="text-muted-400 text-xs mt-1 font-body">{priceDisplay}</p>
            )}
            {errors.price && <p className="text-red-500 text-xs mt-1 font-body">{errors.price}</p>}
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-body font-medium text-primary-700">
                Kategori (opsional)
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="text-xs text-muted-500 hover:text-primary-700 font-body underline"
              >
                + Kategori baru
              </button>
            </div>

            {showNewCategory ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nama kategori..."
                  className="input text-sm flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCategory.trim()) createCategory.mutate()
                  }}
                />
                <button
                  onClick={() => {
                    if (newCategory.trim()) createCategory.mutate()
                  }}
                  disabled={createCategory.isPending || !newCategory.trim()}
                  className="btn-primary px-3 py-2 text-sm flex items-center gap-1"
                >
                  {createCategory.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : 'Simpan'}
                </button>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input text-sm"
              >
                <option value="">-- Tanpa kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Error from API */}
          {saveMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-body px-4 py-3 rounded-xl">
              Gagal menyimpan produk. Coba lagi.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-surface-200 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saveMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
          </button>
        </div>
      </div>
    </div>
  )
}
