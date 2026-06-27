import { useNavigate } from 'react-router-dom'
import { Lock, Zap, Building2, ArrowRight } from 'lucide-react'
import { usePlan, PLAN_LABELS, type PlanLimits, FEATURE_REQUIRED_PLAN } from '../../hooks/usePlan'

interface PlanGateProps {
  /** Feature flag key to check */
  feature: keyof PlanLimits
  /** Page/feature name shown in the upgrade wall */
  featureName: string
  children: React.ReactNode
}

const PLAN_ICONS = {
  pro:        Zap,
  enterprise: Building2,
}

const PLAN_PRICES: Record<string, string> = {
  pro:        'Rp 149.000/bulan',
  enterprise: 'Rp 299.000/bulan',
}

const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    'Inventori & Resep',
    'Produksi + Forecast',
    'Customer & Loyalitas',
    'WA Broadcast',
    'Purchase Order',
    'Link Pre-Order Publik',
    '3 outlet, 5 staff',
  ],
  enterprise: [
    'Semua fitur Pro',
    'Manajemen Reseller & Agen',
    'API Access',
    'White Label',
    'Outlet & staff tak terbatas',
    'Priority Support',
  ],
}

export default function PlanGate({ feature, featureName, children }: PlanGateProps) {
  const { data: plan, isLoading } = usePlan()
  const navigate = useNavigate()

  // Masih loading — tampilkan children (optimistic)
  if (isLoading || !plan) return <>{children}</>

  const hasAccess = plan.limits[feature]
  if (hasAccess) return <>{children}</>

  // Show upgrade wall
  const requiredPlan = FEATURE_REQUIRED_PLAN[feature] ?? 'pro'
  const PlanIcon = PLAN_ICONS[requiredPlan]
  const planLabel = PLAN_LABELS[requiredPlan]
  const planPrice = PLAN_PRICES[requiredPlan]
  const planFeatures = PLAN_FEATURES[requiredPlan] ?? []

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-surface-50 min-h-[60vh]">
      <div className="max-w-md w-full text-center">
        {/* Lock icon */}
        <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <Lock className="w-7 h-7 text-primary-500" />
        </div>

        {/* Title */}
        <h2 className="font-display text-2xl font-bold text-dark-800 mb-2">
          {featureName}
        </h2>
        <p className="font-body text-sm text-muted-500 mb-6">
          Fitur ini tersedia di paket{' '}
          <span className="font-semibold text-primary-600">{planLabel}</span>.
          Upgrade sekarang untuk mengakses.
        </p>

        {/* Plan card */}
        <div className="card p-5 mb-5 text-left border-primary-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <PlanIcon className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-dark-800">Paket {planLabel}</p>
              <p className="font-body text-xs text-primary-600 font-semibold">{planPrice}</p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {planFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2 font-body text-xs text-dark-700">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA buttons */}
        <button
          onClick={() => navigate('/app/upgrade')}
          className="btn-primary w-full flex items-center justify-center gap-2 mb-2"
        >
          Upgrade ke {planLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost w-full text-sm"
        >
          Kembali
        </button>

        {/* Trial note */}
        {plan.trial.isOnTrial && (
          <p className="mt-4 font-body text-xs text-muted-400">
            Anda sedang dalam masa trial. Fitur Pro tersedia selama trial aktif.
          </p>
        )}
      </div>
    </div>
  )
}
