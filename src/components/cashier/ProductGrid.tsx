import { SajiinIcon } from '../ui/SajiinLogo'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Search, Loader2, PackageX } from 'lucide-react'
import { outletProductApi } from '../../services/outletProductService'
import { productApi } from '../../services/productService'
import { useCartStore } from '../../stores/cartStore'

import { formatCurrency, cn } from '../../lib/utils'

const CATEGORY_ALL = '__all__'

interface ProductGridProps {
  triggerSearch?: number
  triggerNumeric?: number | null
  onNumericHandled?: () => void
}

export default function ProductGrid({ triggerSearch, triggerNumeric, onNumericHandled }: ProductGridProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_ALL)
  const addItem = useCartStore((s) => s.addItem)

  const searchRef = useRef<HTMLInputElement>(null)

  // Focus search on shortcut trigger
  useEffect(() => {
    if (triggerSearch) searchRef.current?.focus()
  }, [triggerSearch])

  // Select product by numeric shortcut
  useEffect(() => {
    if (triggerNumeric && filtered.length >= triggerNumeric) {
      const p = filtered[triggerNumeric - 1]; addItem({ id: p.id, name: p.name, price: p.price, categoryId: p.category?.id ?? null, imageUrl: p.imageUrl ?? null })
      onNumericHandled?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerNumeric])

  const { t } = useTranslation()
  const activeOutletId = useCartStore((s) => s.activeOutletId)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['cashier-products', activeOutletId],
    queryFn: async () => {
      if (activeOutletId) {
        try {
          return await outletProductApi.listForCashier(activeOutletId)
        } catch {
          // fallback
        }
      }
      const all = await productApi.list()
      return all.filter((p) => p.isActive).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        category: p.category ?? null,
        stock: null,
      }))
    },
    enabled: true,
  })

  // Derive categories from products
  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category)
        .map((p) => [p.category!.id, p.category!])
    ).values()
  )

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === CATEGORY_ALL || p.category?.id === selectedCategory
    return matchSearch && matchCategory
  })

  return (
    <div className="flex flex-col h-full bg-surface-50">
      {/* Search + filter bar */}
      <div className="px-3 sm:px-5 py-3 sm:py-4 bg-white border-b border-surface-200 space-y-2 sm:space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk... ( / )"
            ref={searchRef}
            className="input pl-9"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            <button
              onClick={() => setSelectedCategory(CATEGORY_ALL)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-body font-medium whitespace-nowrap transition-all flex-shrink-0',
                selectedCategory === CATEGORY_ALL
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 text-primary-600 hover:bg-surface-200'
              )}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-body font-medium whitespace-nowrap transition-all flex-shrink-0',
                  selectedCategory === cat.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 text-primary-600 hover:bg-surface-200'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-surface-300">
            <PackageX className="w-10 h-10" />
            <p className="font-body text-sm">{t('cashier.noProduct')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => addItem({ id: product.id, name: product.name, price: product.price, categoryId: product.category?.id ?? null, imageUrl: product.imageUrl })}
                className="bg-white rounded-2xl border border-surface-200 p-3 text-left
                           hover:border-primary-400 hover:shadow-warm transition-all duration-150
                           active:scale-[0.97] group"
              >
                {/* Image / placeholder */}
                <div className="w-full aspect-square rounded-xl bg-surface-100 mb-3 overflow-hidden flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <SajiinIcon size={40} className="opacity-20" />
                  )}
                </div>

                <p className="font-body text-sm font-semibold text-dark-700 leading-snug line-clamp-2 mb-1">
                  {product.name}
                </p>

                {product.stock !== null && product.stock !== undefined && (
                  <span className={cn(
                    'font-body text-[10px] font-medium px-1.5 py-0.5 rounded-md',
                    product.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-surface-100 text-muted-500'
                  )}>
                    Stok: {product.stock}
                  </span>
                )}

                {product.category && (
                  <p className="font-body text-xs text-muted-400 mb-1.5">{product.category.name}</p>
                )}

                <p className="font-mono text-base font-medium text-primary-600">
                  {formatCurrency(product.price)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
