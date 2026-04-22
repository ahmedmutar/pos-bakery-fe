import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { TrendingUp, ShoppingBag, ChefHat, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { reportApi } from '../services/reportService'
import { useWebSocket } from '../hooks/useWebSocket'
import { formatCurrency } from '../lib/utils'

export default function DashboardPage() {
  const { t } = useTranslation()

  const [flash, setFlash] = useState(false)
  const { on, isConnected } = useWebSocket()

  // Flash animation when new transaction arrives
  useEffect(() => {
    return on('TRANSACTION_CREATED', () => {
      setFlash(true)
      setTimeout(() => setFlash(false), 1000)
    })
  }, [on])

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportApi.dashboard,
    refetchInterval: 30_000, // refresh every 30s
  })

  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => reportApi.topProducts({ limit: 5 }),
  })

  const stats = summary
    ? [
        {
          key: 'todaySales',
          icon: TrendingUp,
          value: formatCurrency(summary.todaySales),
          sub: `${summary.transactionCount} transaksi`,
          positive: true,
          color: 'bg-crust-100 text-crust-600',
        },
        {
          key: 'transactions',
          icon: ShoppingBag,
          value: String(summary.transactionCount),
          sub: 'hari ini',
          positive: true,
          color: 'bg-dough-100 text-dough-500',
        },
        {
          key: 'production',
          icon: ChefHat,
          value: `${summary.totalProduced} pcs`,
          sub: 'diproduksi',
          positive: true,
          color: 'bg-green-50 text-green-600',
        },
        {
          key: 'waste',
          icon: Trash2,
          value: `${summary.totalWaste} pcs`,
          sub: 'sisa/waste',
          positive: false,
          color: 'bg-red-50 text-red-400',
        },
      ]
    : []

  const maxRevenue = topProducts?.[0]?.totalRevenue ?? 1

  return (
    <div className="space-y-6">
      {/* Live status indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-crust-300'}`} />
        <span className="font-body text-xs text-crust-400">
          {isConnected ? t('dashboard.liveIndicator') : t('dashboard.connectingLive')}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {loadingSummary
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card flex items-center justify-center h-28">
                <Loader2 className="w-5 h-5 text-crust-400 animate-spin" />
              </div>
            ))
          : stats.map(({ key, icon: Icon, value, sub, positive, color }) => (
              <div key={key} className={`card flex flex-col gap-3 transition-all duration-300 ${flash ? 'ring-2 ring-crust-400 ring-opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-crust-500"><span className="uppercase tracking-widest text-[10px]">{t(`dashboard.${key}`)}</span></span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-oven-800 tracking-tight">{value}</p>
                  <p className={`font-body text-xs mt-0.5 ${positive ? 'text-green-600' : 'text-red-400'}`}>
                    {sub}
                  </p>
                </div>
              </div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="card xl:col-span-2">
          <h2 className="font-display text-base font-semibold text-oven-800 mb-4">
            <span className="font-display text-base font-bold tracking-tight">{t('dashboard.topProducts')}</span>
          </h2>

          {loadingProducts ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-crust-400 animate-spin" />
            </div>
          ) : topProducts && topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.product.id} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-crust-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-oven-700 truncate">{p.product.name}</p>
                    <div className="w-full bg-dough-100 rounded-full h-1.5 mt-1.5">
                      <div
                        className="bg-crust-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(p.totalRevenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-body text-xs font-medium text-oven-700">{formatCurrency(p.totalRevenue)}</p>
                    <p className="font-body text-xs text-crust-400">{p.totalSold} pcs</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-sm text-crust-400 text-center py-8">
              Belum ada data penjualan hari ini.
            </p>
          )}
        </div>

        {/* Low stock alert */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-display text-base font-semibold text-oven-800">
              {t('dashboard.lowStock')}
            </h2>
            {summary && summary.lowStockCount > 0 && (
              <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-body font-medium px-2 py-0.5 rounded-full">
                {summary.lowStockCount}
              </span>
            )}
          </div>

          {loadingSummary ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-5 h-5 text-crust-400 animate-spin" />
            </div>
          ) : summary?.lowStockItems.length ? (
            <div className="space-y-2">
              {summary.lowStockItems.map((item) => (
                <div key={item.id} className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <p className="font-body text-sm font-medium text-oven-700">{item.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-body text-xs text-amber-600 font-medium">
                      {item.currentStock} {item.baseUnit}
                    </span>
                    <span className="font-body text-xs text-crust-400">
                      / min {item.minimumStock} {item.baseUnit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-sm text-crust-400 text-center py-8">
              Semua stok aman.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
