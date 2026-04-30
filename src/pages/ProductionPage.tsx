import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, ChefHat, Loader2, Calendar,
  CheckCircle, Clock, TrendingDown,
} from 'lucide-react'
import { productionApi, type ProductionPlan } from '../services/productionService'
import { formatCurrency, cn } from '../lib/utils'
import CreatePlanModal from '../components/production/CreatePlanModal'
import ProductionPlanDetail from '../components/production/ProductionPlanDetail'

export default function ProductionPage() {
  const [showCreate, setShowCreate] = useState(false)
  const { t } = useTranslation()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [deductionToast, setDeductionToast] = useState<{
    productName: string
    delta: number
    items: { ingredientName: string; unit: string; deducted: number }[]
  } | null>(null)

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['production'],
    queryFn: () => productionApi.list(),
  })

  const { data: todayPlan } = useQuery({
    queryKey: ['production', 'today'],
    queryFn: productionApi.today,
  })

  // If viewing a specific plan
  if (selectedPlanId) {
    return (
      <ProductionPlanDetail
        planId={selectedPlanId}
        onBack={() => setSelectedPlanId(null)}
      />
    )
  }

  const getPlanStatus = (plan: ProductionPlan) => {
    const total = plan.items.length
    const done = plan.items.filter((i) => i.actualQty > 0).length
    if (done === 0) return 'pending'
    if (done < total) return 'partial'
    return 'done'
  }

  const getTotalWaste = (plan: ProductionPlan) =>
    plan.items.reduce((s, i) => s + i.wasteQty + i.unsoldQty, 0)

  const getWasteValue = (plan: ProductionPlan) =>
    plan.items.reduce((s, i) => s + (i.wasteQty + i.unsoldQty) * i.product.price, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-muted-400">
          {plans.length} rencana produksi
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Buat Rencana
        </button>
      </div>

      {/* Today's plan highlight */}
      {todayPlan && (
        <div
          className="card border-surface-300 bg-surface-50 cursor-pointer hover:border-primary-400 transition-all"
          onClick={() => setSelectedPlanId(todayPlan.id)}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="font-display text-base font-semibold text-dark-800">Produksi Hari Ini</p>
            </div>
            <span className="font-body text-xs text-muted-500">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
            </span>
          </div>

          <div className="flex gap-4">
            {todayPlan.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="font-body text-sm text-dark-700">{item.product.name}</span>
                <span className={cn(
                  'font-body text-xs px-2 py-0.5 rounded-full',
                  item.actualQty > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-surface-200 text-muted-500'
                )}>
                  {item.actualQty > 0 ? `${item.actualQty}/${item.targetQty}` : `target ${item.targetQty}`} pcs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plans list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-surface-300">
          <ChefHat className="w-10 h-10" />
          <p className="font-body text-sm">{t('production.noPlan')}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary text-sm"
          >
            Buat rencana pertama
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => {
            const status = getPlanStatus(plan)
            const waste = getTotalWaste(plan)
            const wasteVal = getWasteValue(plan)
            const totalTarget = plan.items.reduce((s, i) => s + i.targetQty, 0)
            const totalActual = plan.items.reduce((s, i) => s + i.actualQty, 0)

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className="card hover:border-surface-300 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Status icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    status === 'done' ? 'bg-green-100' :
                    status === 'partial' ? 'bg-amber-100' : 'bg-surface-100'
                  )}>
                    {status === 'done' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : status === 'partial' ? (
                      <Clock className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Calendar className="w-5 h-5 text-muted-400" />
                    )}
                  </div>

                  {/* Date + products */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-body text-sm font-semibold text-dark-800">
                        {new Date(plan.date).toLocaleString('id-ID', {
                          weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                      {plan.notes && (
                        <span className="font-body text-xs text-muted-400">· {plan.notes}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {plan.items.slice(0, 4).map((item) => (
                        <span key={item.id} className="font-body text-xs bg-surface-100 text-primary-600 px-2 py-0.5 rounded-lg">
                          {item.product.name} {item.targetQty}pcs
                        </span>
                      ))}
                      {plan.items.length > 4 && (
                        <span className="font-body text-xs text-muted-400">
                          +{plan.items.length - 4} lagi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="font-body text-xs text-muted-500">
                      {totalActual > 0
                        ? <span className="text-green-700 font-medium">{totalActual}</span>
                        : '—'
                      } / {totalTarget} pcs
                    </p>
                    {waste > 0 && (
                      <p className="font-body text-xs text-red-500 flex items-center gap-1 justify-end">
                        <TrendingDown className="w-3 h-3" />
                        {waste} pcs waste · {formatCurrency(wasteVal)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreatePlanModal
          onClose={() => setShowCreate(false)}
          onSuccess={(id) => {
            setShowCreate(false)
            setSelectedPlanId(id)
          }}
        />
      )}
    {/* Stock deduction toast */}
    {deductionToast && (
      <div className="fixed bottom-6 right-6 z-50 w-80 bg-dark-800 text-white rounded-2xl shadow-warm-lg p-4 space-y-2 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <p className="font-body text-sm font-semibold">{t('production.stockDeducted')}</p>
          </div>
          <button onClick={() => setDeductionToast(null)} className="text-surface-300 hover:text-white text-xs">
            ✕
          </button>
        </div>
        <p className="font-body text-xs text-surface-300">
          {deductionToast.productName} · {deductionToast.delta} pcs diproduksi
        </p>
        <div className="space-y-1 pt-1 border-t border-dark-700">
          {deductionToast.items.map((item) => (
            <div key={item.ingredientName} className="flex justify-between font-body text-xs">
              <span className="text-surface-200">{item.ingredientName}</span>
              <span className="font-mono text-surface-300">
                -{Math.abs(item.deducted).toFixed(1)} {item.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
    </div>
  )
}
