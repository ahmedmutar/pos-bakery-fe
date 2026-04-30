import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CreditCard, CheckCircle, Clock, ArrowRight, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { usePlan, PLAN_LABELS } from '../hooks/usePlan'
import { cn } from '../lib/utils'

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: 149_000,
    features: ['1 outlet', '3 staff', '50 produk', 'Kasir & laporan'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 349_000,
    badge: 'Populer',
    features: ['5 outlet', '10 staff', 'Produk tak terbatas', 'Forecast & Import Excel'],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 999_000,
    features: ['Outlet tak terbatas', 'Staff tak terbatas', 'White label', 'API access'],
  },
]

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function BillingPage() {
  const { data: plan } = usePlan()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const { data: history = [] } = useQuery({
    queryKey: ['billing-history'],
    queryFn: async () => (await api.get('/billing/history')).data,
  })

  const checkoutMutation = useMutation({
    mutationFn: async (planKey: string) => {
      const res = await api.post('/billing/checkout', { plan: planKey })
      return res.data as { invoiceUrl: string }
    },
    onSuccess: (data) => {
      window.open(data.invoiceUrl, '_blank')
    },
  })

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-xl font-bold text-dark-800">Billing & Langganan</h1>
        <p className="font-body text-sm text-muted-400 mt-0.5">
          Kelola paket dan riwayat pembayaran Anda
        </p>
      </div>

      {/* Current plan */}
      <div className="card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-body text-xs text-muted-400">Paket aktif</p>
            <p className="font-display text-lg font-bold text-dark-800">
              {PLAN_LABELS[plan?.plan ?? 'basic']}
            </p>
          </div>
        </div>
        {plan?.trial.isOnTrial && !plan.trial.expired && (
          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
            <Clock className="w-4 h-4" />
            <span className="font-body text-sm font-medium">{plan.trial.daysLeft} hari trial</span>
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(({ key, name, price, badge, features }) => {
          const isCurrent = key === plan?.plan && !plan.trial.isOnTrial
          return (
            <div
              key={key}
              className={cn(
                'card flex flex-col border-2 transition-all',
                isCurrent ? 'border-green-400' : selectedPlan === key ? 'border-primary-500' : 'border-transparent',
              )}
            >
              {badge && (
                <span className="self-start bg-primary-600 text-white text-xs font-body font-semibold px-3 py-1 rounded-full mb-3">
                  {badge}
                </span>
              )}
              <p className="font-display text-lg font-bold text-dark-800">{name}</p>
              <p className="font-display text-2xl font-bold text-dark-800 mt-1 mb-3">
                {formatRp(price)}<span className="font-body text-sm font-normal text-muted-400">/bln</span>
              </p>
              <ul className="space-y-1.5 flex-1 mb-4">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 font-body text-xs text-primary-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full py-2 text-center font-body text-sm text-green-600 font-medium">
                  ✓ Paket Aktif
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedPlan(key)
                    checkoutMutation.mutate(key)
                  }}
                  disabled={checkoutMutation.isPending && selectedPlan === key}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                >
                  {checkoutMutation.isPending && selectedPlan === key
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ArrowRight className="w-4 h-4" />
                  }
                  Upgrade
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment history */}
      {history.length > 0 && (
        <div className="card">
          <p className="font-body text-sm font-semibold text-dark-800 mb-4">Riwayat Pembayaran</p>
          <div className="space-y-3">
            {history.map((sub: {
              id: string
              plan: string
              status: string
              amount: number
              paidAt: string | null
              periodEnd: string | null
            }) => (
              <div key={sub.id} className="flex items-center justify-between py-2 border-b border-surface-200 last:border-0">
                <div>
                  <p className="font-body text-sm font-semibold text-dark-800">
                    Paket {PLAN_LABELS[sub.plan] ?? sub.plan}
                  </p>
                  <p className="font-body text-xs text-muted-400">
                    {sub.paidAt ? new Date(sub.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Menunggu pembayaran'}
                    {sub.periodEnd && ` · Aktif hingga ${new Date(sub.periodEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body text-sm font-semibold text-dark-800">{formatRp(sub.amount)}</p>
                  <span className={cn(
                    'font-body text-xs px-2 py-0.5 rounded-full',
                    sub.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    sub.status === 'PENDING' ? 'bg-gold-200 text-accent-600' :
                    'bg-red-100 text-red-600'
                  )}>
                    {sub.status === 'PAID' ? 'Lunas' : sub.status === 'PENDING' ? 'Menunggu' : 'Gagal'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
