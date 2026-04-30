import { SajiinIcon } from '../components/ui/SajiinLogo'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp, TrendingDown, Minus, Loader2,
  ChefHat, Calendar, Info, CheckCircle,
  ArrowRight, BarChart3, Sparkles,
} from 'lucide-react'
import { forecastApi, type ProductForecast } from '../services/forecastService'
import { productionApi } from '../services/productionService'
import { formatCurrency, cn } from '../lib/utils'

const LOOKBACK_OPTIONS = [
  { value: 7,  label: '7 hari' },
  { value: 14, label: '14 hari' },
  { value: 30, label: '30 hari' },
]

const CONFIDENCE_CONFIG = {
  high:   { labelKey: 'forecast.confidenceHigh',   color: 'text-green-600  bg-green-50  border-green-200' },
  medium: { labelKey: 'forecast.confidenceMedium', color: 'text-amber-600  bg-amber-50  border-amber-200' },
  low:    { labelKey: 'forecast.confidenceLow',    color: 'text-muted-500  bg-surface-100 border-surface-200' },
}

const TREND_CONFIG = {
  naik:   { icon: TrendingUp,   color: 'text-green-600', labelKey: 'forecast.trendUp' },
  turun:  { icon: TrendingDown, color: 'text-red-500',   labelKey: 'forecast.trendDown' },
  stabil: { icon: Minus,        color: 'text-muted-500', labelKey: 'forecast.trendStable' },
}

export default function ForecastPage() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  const [lookback, setLookback] = useState(14)
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today')
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['forecast', lookback],
    queryFn: () => forecastApi.get(lookback),
    staleTime: 5 * 60 * 1000,
  })

  const createPlanMutation = useMutation({
    mutationFn: () => {
      const targetDate = selectedDay === 'today' ? new Date() : (() => {
        const d = new Date(); d.setDate(d.getDate() + 1); return d
      })()

      const items = (data?.forecasts ?? [])
        .filter((f) => selectedProducts.size === 0 || selectedProducts.has(f.product.id))
        .filter((f) => {
          const qty = selectedDay === 'today' ? f.todaySuggested : f.tomorrowSuggested
          return qty > 0
        })
        .map((f) => ({
          productId: f.product.id,
          targetQty: selectedDay === 'today' ? f.todaySuggested : f.tomorrowSuggested,
        }))

      return productionApi.create({
        date: targetDate.toISOString(),
        notes: `Dibuat dari forecast (data ${lookback} hari terakhir)`,
        items,
      })
    },
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: ['production'] })
      setCreatedPlanId(plan.id)
    },
  })

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const forecasts = data?.forecasts ?? []
  const hasData = forecasts.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-muted-500" />
            <h2 className="font-display text-lg font-semibold text-dark-800">
              Forecast Produksi
            </h2>
          </div>
          <p className="font-body text-sm text-muted-500">
            Saran jumlah produksi berdasarkan histori penjualan
            {data && ` · Hari ini: ${data.dayOfWeek}`}
          </p>
        </div>

        {/* Lookback selector */}
        <div className="flex items-center gap-2">
          <span className="font-body text-xs text-muted-400">Data dari</span>
          <div className="flex bg-surface-100 rounded-xl p-1 gap-1">
            {LOOKBACK_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setLookback(value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all',
                  lookback === value
                    ? 'bg-white text-dark-800 shadow-warm'
                    : 'text-muted-500 hover:text-primary-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {isFetching && <Loader2 className="w-4 h-4 text-muted-400 animate-spin" />}
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-surface-300">
          <BarChart3 className="w-12 h-12" />
          <p className="font-body text-sm text-center">
            Belum ada data penjualan yang cukup untuk forecast.
            <br />
            Mulai catat transaksi di kasir untuk melihat saran produksi.
          </p>
        </div>
      ) : (
        <>
          {/* Day selector + create plan */}
          <div className="card flex items-center gap-4 flex-wrap">
            <div>
              <p className="font-body text-sm font-medium text-dark-800 mb-2">
                Buat rencana produksi untuk:
              </p>
              <div className="flex bg-surface-100 rounded-xl p-1 gap-1">
                {[
                  { key: 'today' as const, label: t('forecast.todayTarget') },
                  { key: 'tomorrow' as const, label: t('forecast.tomorrowTarget') },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-body font-medium transition-all',
                      selectedDay === key
                        ? 'bg-white text-dark-800 shadow-warm'
                        : 'text-muted-500 hover:text-primary-700'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-body text-xs text-muted-400 mb-1">
                {selectedProducts.size === 0
                  ? `Semua ${forecasts.length} produk akan dimasukkan`
                  : `${selectedProducts.size} produk dipilih`}
              </p>
              <p className="font-body text-xs text-muted-400">
                Total target:{' '}
                <span className="font-semibold text-dark-800">
                  {forecasts
                    .filter((f) => selectedProducts.size === 0 || selectedProducts.has(f.product.id))
                    .reduce((s, f) => s + (selectedDay === 'today' ? f.todaySuggested : f.tomorrowSuggested), 0)}{' '}
                  pcs
                </span>
              </p>
            </div>

            {createdPlanId ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-body text-sm font-medium">Rencana dibuat!</span>
                <a
                  href="/production"
                  className="font-body text-sm underline text-primary-600 flex items-center gap-1"
                >
                  Lihat <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <button
                onClick={() => createPlanMutation.mutate()}
                disabled={createPlanMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {createPlanMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <ChefHat className="w-4 h-4" />
                }
                Buat Rencana Produksi
              </button>
            )}
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-muted-400 flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-muted-500">
              Angka forecast dihitung dari rata-rata penjualan per hari dalam minggu berdasarkan {lookback} hari terakhir,
              disesuaikan dengan tren terkini dan buffer stok 10%. Centang produk tertentu jika ingin membuat rencana parsial.
            </p>
          </div>

          {/* Product forecast cards */}
          <div className="space-y-3">
            {forecasts.map((forecast) => (
              <ForecastCard
                key={forecast.product.id}
                forecast={forecast}
                selectedDay={selectedDay}
                isSelected={selectedProducts.has(forecast.product.id)}
                onToggle={() => toggleProduct(forecast.product.id)}
                allSelected={selectedProducts.size === 0}
                lookback={lookback}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ForecastCard({ forecast, selectedDay, isSelected, onToggle, allSelected, lookback }: {
  forecast: ProductForecast
  selectedDay: 'today' | 'tomorrow'
  isSelected: boolean
  onToggle: () => void
  allSelected: boolean
  lookback: number
}) {
  const { t } = useTranslation()
  const [showWeek, setShowWeek] = useState(false)
  const trendKey = forecast.trendLabel as keyof typeof TREND_CONFIG
  const { labelKey: trendLabelKey, icon: TrendIcon, color: trendColor } = TREND_CONFIG[trendKey]
  const trendLabel = t(trendLabelKey)
  const todayForecast = forecast.next7Days[0]
  const targetQty = selectedDay === 'today' ? forecast.todaySuggested : forecast.tomorrowSuggested
  return (
    <div className={cn(
      'card transition-all',
      !allSelected && !isSelected && 'opacity-60',
    )}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
            isSelected
              ? 'bg-primary-600 border-primary-600'
              : allSelected
              ? 'border-surface-300 bg-white'
              : 'border-surface-300 bg-white'
          )}
        >
          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
        </button>

        {/* Product image */}
        <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {forecast.product.imageUrl
            ? <img src={forecast.product.imageUrl} alt={forecast.product.name} className="w-full h-full object-cover" />
            : <SajiinIcon size={32} className="opacity-25" />
          }
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-body text-sm font-semibold text-dark-800">{forecast.product.name}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={cn('flex items-center gap-1 font-body text-xs', trendColor)}>
                  <TrendIcon className="w-3 h-3" />
                  {trendLabel}
                  {forecast.trendFactor !== 1 && (
                    <span>({forecast.trendFactor > 1 ? '+' : ''}{Math.round((forecast.trendFactor - 1) * 100)}%)</span>
                  )}
                </span>
                <span className="font-body text-xs text-muted-400">
                  Rata-rata {forecast.avgPerDay} pcs/hari
                </span>
              </div>
            </div>

            {/* Today/tomorrow target */}
            <div className="text-right flex-shrink-0">
              <p className="font-body text-xs text-muted-400 mb-0.5">
                {selectedDay === 'today' ? t('forecast.todayTarget') : t('forecast.tomorrowTarget')}
              </p>
              <p className="font-display text-2xl font-semibold text-primary-700">
                {targetQty}
                <span className="font-body text-sm text-muted-400 ml-1">pcs</span>
              </p>
              {todayForecast && (
                <span className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-body font-medium border',
                  CONFIDENCE_CONFIG[todayForecast.confidence].color
                )}>
                  {t(CONFIDENCE_CONFIG[todayForecast.confidence].labelKey)}
                </span>
              )}
            </div>
          </div>

          {/* 7-day mini chart */}
          <button
            onClick={() => setShowWeek((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-body text-muted-400 hover:text-primary-600 transition-colors mb-2"
          >
            <Calendar className="w-3 h-3" />
            {showWeek ? t('forecast.hide7Days') : t('forecast.next7Days')}
          </button>

          {showWeek && (
            <div className="grid grid-cols-7 gap-1.5 mt-2">
              {forecast.next7Days.map((day) => {
                const maxSuggested = Math.max(...forecast.next7Days.map((d) => d.suggested))
                const heightPct = maxSuggested > 0 ? (day.suggested / maxSuggested) * 100 : 0
                return (
                  <div key={day.date} className="text-center">
                    <div className="h-16 flex items-end justify-center mb-1">
                      <div
                        className={cn(
                          'w-full rounded-t-md transition-all',
                          day.isToday ? 'bg-primary-600' :
                          day.isTomorrow ? 'bg-muted-400' :
                          'bg-surface-300'
                        )}
                        style={{ height: `${Math.max(heightPct, 8)}%` }}
                      />
                    </div>
                    <p className={cn(
                      'font-body text-[10px] leading-tight',
                      day.isToday ? 'text-primary-700 font-semibold' : 'text-muted-400'
                    )}>
                      {day.dayName.slice(0, 3)}
                    </p>
                    <p className="font-mono text-[10px] font-semibold text-dark-800">
                      {day.suggested}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Stats row */}
          <div className="flex gap-4 mt-2">
            <span className="font-body text-xs text-muted-400">
              Terjual {lookback} hari: <span className="font-medium text-dark-700">{forecast.totalSold} pcs</span>
            </span>
            <span className="font-body text-xs text-muted-400">
              Hari terbaik: <span className="font-medium text-dark-700">{forecast.bestDay}</span>
            </span>
            <span className="font-body text-xs text-muted-400">
              Est. revenue: <span className="font-medium text-dark-700">{formatCurrency(targetQty * forecast.product.price)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
