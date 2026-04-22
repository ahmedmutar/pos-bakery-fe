import { useQuery } from '@tanstack/react-query'
import { X, TrendingUp, TrendingDown, Loader2, AlertCircle } from 'lucide-react'
import { productApi } from '../../services/productService'
import { formatCurrency, cn } from '../../lib/utils'

interface FoodCostDrawerProps {
  productId: string
  productName: string
  onClose: () => void
}

export default function FoodCostDrawer({ productId, productName, onClose }: FoodCostDrawerProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['food-cost', productId],
    queryFn: () => productApi.foodCost(productId),
  })

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100 flex-shrink-0">
          <div>
            <h2 className="font-display text-lg font-semibold text-oven-800">Food Cost</h2>
            <p className="font-body text-xs text-crust-400">{productName}</p>
          </div>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-thin">
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
            </div>
          )}

          {error && (
            <div className="px-6 py-8 flex flex-col items-center gap-2 text-crust-400">
              <AlertCircle className="w-8 h-8" />
              <p className="font-body text-sm text-center">
                Produk ini belum punya resep. Tambah resep terlebih dahulu untuk melihat food cost.
              </p>
            </div>
          )}

          {data && (
            <div className="px-6 py-5 space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-dough-50 rounded-xl p-3 text-center">
                  <p className="font-body text-xs text-crust-400 mb-1">Harga Jual</p>
                  <p className="font-display text-base font-semibold text-oven-800">
                    {formatCurrency(data.sellingPrice)}
                  </p>
                </div>
                <div className="bg-dough-50 rounded-xl p-3 text-center">
                  <p className="font-body text-xs text-crust-400 mb-1">Food Cost/pcs</p>
                  <p className="font-display text-base font-semibold text-oven-800">
                    {formatCurrency(data.costPerPcs)}
                  </p>
                </div>
                <div className={cn(
                  'rounded-xl p-3 text-center',
                  data.marginPercent >= 30 ? 'bg-green-50' : 'bg-amber-50'
                )}>
                  <p className="font-body text-xs text-crust-400 mb-1">Margin</p>
                  <p className={cn(
                    'font-display text-base font-semibold',
                    data.marginPercent >= 30 ? 'text-green-700' : 'text-amber-700'
                  )}>
                    {data.marginPercent}%
                  </p>
                </div>
              </div>

              {/* Margin indicator */}
              <div>
                <div className="flex justify-between font-body text-xs text-crust-400 mb-1.5">
                  <span>Food Cost Ratio</span>
                  <span>{100 - data.marginPercent}%</span>
                </div>
                <div className="w-full h-2 bg-dough-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      data.marginPercent >= 40 ? 'bg-green-500' :
                      data.marginPercent >= 25 ? 'bg-amber-400' : 'bg-red-400'
                    )}
                    style={{ width: `${data.marginPercent}%` }}
                  />
                </div>
                <div className="flex justify-between font-body text-xs mt-1">
                  <span className="text-red-400">Rugi</span>
                  <span className="text-amber-500">Cukup</span>
                  <span className="text-green-500">Bagus</span>
                </div>
              </div>

              {/* Profit per pcs */}
              <div className="flex items-center gap-3 bg-dough-50 rounded-xl px-4 py-3">
                {data.margin >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className="font-body text-xs text-crust-500">Keuntungan per pcs</p>
                  <p className={cn(
                    'font-display text-lg font-semibold',
                    data.margin >= 0 ? 'text-green-700' : 'text-red-600'
                  )}>
                    {formatCurrency(data.margin)}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-body text-xs text-crust-500">Per batch ({data.batchSize} pcs)</p>
                  <p className="font-body text-sm font-medium text-crust-600">
                    {formatCurrency(data.margin * data.batchSize)}
                  </p>
                </div>
              </div>

              {/* Ingredient breakdown */}
              <div>
                <p className="font-body text-sm font-medium text-crust-700 mb-2">
                  Rincian Bahan ({data.batchSize} pcs)
                </p>
                <div className="space-y-2">
                  {data.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-dough-100 last:border-0">
                      <div>
                        <p className="font-body text-sm text-oven-700">{item.ingredient}</p>
                        <p className="font-body text-xs text-crust-400">
                          {item.amount} {item.unit}
                        </p>
                      </div>
                      <p className="font-body text-sm font-medium text-crust-600">
                        {formatCurrency(item.costContribution)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-2 mt-1">
                  <span className="font-body text-sm font-semibold text-oven-800">Total biaya batch</span>
                  <span className="font-body text-sm font-semibold text-oven-800">
                    {formatCurrency(data.totalBatchCost)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
