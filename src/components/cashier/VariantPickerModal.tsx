import { useQuery } from '@tanstack/react-query'
import { X, Loader2, Tag } from 'lucide-react'
import { variantApi, type ProductVariant } from '../../services/variantService'
import { formatCurrency, cn } from '../../lib/utils'

interface CashierProduct {
  id: string
  name: string
  price: number
  imageUrl?: string | null
  category?: { id: string; name: string } | null
}

interface VariantPickerModalProps {
  product: CashierProduct
  onSelect: (variant: ProductVariant | null) => void
  onClose: () => void
}

export default function VariantPickerModal({ product, onSelect, onClose }: VariantPickerModalProps) {
  const { data: variants = [], isLoading } = useQuery<ProductVariant[]>({
    queryKey: ['variants', product.id],
    queryFn: () => variantApi.list(product.id),
  })

  const activeVariants = variants.filter(v => v.isActive)

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xs rounded-t-2xl sm:rounded-2xl shadow-warm-lg">
        {/* Header */}
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <div>
            <p className="font-body text-xs text-muted-400">Pilih varian untuk</p>
            <p className="font-display text-base font-semibold text-dark-800 leading-tight">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Variants */}
        <div className="px-4 py-3 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
            </div>
          ) : activeVariants.length === 0 ? (
            /* No variants — add product directly */
            <button
              onClick={() => onSelect(null)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all',
                'border-primary-300 bg-primary-50 hover:bg-primary-100'
              )}
            >
              <span className="font-body text-sm font-semibold text-primary-700">{product.name}</span>
              <span className="font-mono text-sm font-bold text-primary-600">{formatCurrency(product.price)}</span>
            </button>
          ) : (
            activeVariants
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(variant => (
                <button
                  key={variant.id}
                  onClick={() => onSelect(variant)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all',
                    'border-surface-200 bg-white hover:border-primary-400 hover:bg-primary-50',
                    'active:scale-[0.98]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-muted-400" />
                    <span className="font-body text-sm font-semibold text-dark-800">{variant.name}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary-600">{formatCurrency(variant.price)}</span>
                </button>
              ))
          )}
        </div>

        {/* Separator + base product option when variants exist */}
        {activeVariants.length > 0 && (
          <div className="px-4 pb-4">
            <button
              onClick={() => onSelect(null)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-surface-200 bg-surface-50 hover:bg-surface-100 transition-all"
            >
              <span className="font-body text-xs text-muted-500">Tanpa varian (harga dasar)</span>
              <span className="font-mono text-xs text-muted-500">{formatCurrency(product.price)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
