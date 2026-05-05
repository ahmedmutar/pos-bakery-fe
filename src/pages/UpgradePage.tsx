import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle, ArrowLeft, Zap, Building2, Rocket, Loader2, ExternalLink, MessageCircle } from 'lucide-react'
import { usePlan, PLAN_LABELS } from '../hooks/usePlan'
import { cn } from '../lib/utils'
import api from '../lib/api'

const PLANS = [
  {
    key: 'basic',
    icon: Zap,
    name: 'Basic',
    price: 149000,
    period: '/bulan',
    desc: 'Untuk bisnis kuliner kecil yang baru mulai',
    color: 'border-surface-300',
    features: ['1 outlet','3 staff','50 produk','Kasir & shift','Laporan penjualan','Pre-order'],
  },
  {
    key: 'pro',
    icon: Rocket,
    name: 'Pro',
    price: 349000,
    period: '/bulan',
    desc: 'Untuk bisnis kuliner yang sedang berkembang',
    color: 'border-primary-500',
    badge: 'Paling Populer',
    features: ['Hingga 5 outlet','10 staff','Produk tidak terbatas','Semua fitur Basic','Forecast produksi','Import Excel','Resep & food cost'],
  },
  {
    key: 'enterprise',
    icon: Building2,
    name: 'Enterprise',
    price: 0,
    period: '',
    desc: 'Untuk jaringan bisnis kuliner & franchise',
    color: 'border-dark-600',
    features: ['Outlet tidak terbatas','Staff tidak terbatas','Semua fitur Pro','White label','API access','Dedicated support','SLA guaranteed'],
  },
]

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function UpgradePage() {
  const navigate    = useNavigate()
  const { data: plan } = usePlan()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState('')

  const currentPlan = plan?.plan ?? 'basic'
  const daysLeft    = plan?.trial.daysLeft ?? 0
  const isExpired   = plan?.trial.expired ?? false
  const isOnTrial   = plan?.trial.isOnTrial ?? false

  const checkoutMutation = useMutation({
    mutationFn: async (planKey: string) => {
      const res = await api.post('/billing/checkout', { plan: planKey })
      return res.data as { invoiceUrl: string }
    },
    onSuccess: (data) => {
      window.open(data.invoiceUrl, '_blank')
      setLoadingPlan(null)
    },
    onError: () => {
      setError('Gagal membuat invoice. Coba lagi atau hubungi kami.')
      setLoadingPlan(null)
    },
  })

  const handleUpgrade = (planKey: string) => {
    if (planKey === 'enterprise') {
      window.open('https://wa.me/6208970120687?text=Halo, saya ingin upgrade ke paket Enterprise Sajiin', '_blank')
      return
    }
    setError('')
    setLoadingPlan(planKey)
    checkoutMutation.mutate(planKey)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-100 transition-colors text-muted-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-dark-800">Upgrade Paket</h1>
          <p className="font-body text-sm text-muted-400 mt-0.5">
            Paket saat ini: <span className="font-semibold text-primary-600">{PLAN_LABELS[currentPlan] ?? currentPlan}</span>
            {isOnTrial && !isExpired && <span className="ml-2 text-accent-500 font-medium">· {daysLeft} hari trial tersisa</span>}
            {isExpired && <span className="ml-2 text-red-500 font-medium">· Trial sudah berakhir</span>}
          </p>
        </div>
      </div>

      {/* Expired banner */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
          <div>
            <p className="font-body text-sm font-semibold text-red-700">Trial Anda telah berakhir</p>
            <p className="font-body text-sm text-red-600 mt-0.5">
              Pilih paket di bawah dan selesaikan pembayaran untuk melanjutkan. Data Anda tetap aman.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(({ key, icon: Icon, name, price, period, desc, color, badge, features }) => {
          const isCurrent  = key === currentPlan && !isExpired && !isOnTrial
          const isLoading  = loadingPlan === key
          const isEnterprise = key === 'enterprise'

          return (
            <div
              key={key}
              className={cn(
                'relative rounded-2xl border-2 p-6 bg-white flex flex-col shadow-warm transition-all',
                color,
                isCurrent && 'ring-2 ring-primary-400 ring-offset-2',
                badge && 'border-primary-500'
              )}
            >
              {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-body font-semibold px-4 py-1.5 rounded-full">{badge}</span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-full">Aktif</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-surface-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="font-display text-lg font-bold text-dark-800">{name}</h3>
              </div>

              <p className="font-body text-xs text-muted-400 mb-4">{desc}</p>

              <div className="mb-5">
                {price > 0
                  ? <><span className="font-display text-2xl font-bold text-dark-800">{formatRp(price)}</span><span className="font-body text-sm text-muted-400">{period}</span></>
                  : <span className="font-display text-2xl font-bold text-dark-800">Custom</span>
                }
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-body text-sm text-primary-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && handleUpgrade(key)}
                disabled={isCurrent || isLoading}
                className={cn(
                  'w-full py-3 rounded-xl font-body font-semibold text-sm transition-all flex items-center justify-center gap-2',
                  isCurrent
                    ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                    : isEnterprise
                    ? 'bg-dark-800 text-white hover:bg-dark-700'
                    : badge
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-warm'
                    : 'bg-surface-100 text-primary-700 hover:bg-surface-200 border border-surface-300'
                )}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                ) : isCurrent ? (
                  'Paket Saat Ini'
                ) : isEnterprise ? (
                  <><MessageCircle className="w-4 h-4" /> Hubungi Sales</>
                ) : (
                  <><ExternalLink className="w-4 h-4" /> Bayar Sekarang</>
                )}
              </button>

              {/* Info pembayaran */}
              {!isCurrent && !isEnterprise && (
                <p className="text-center text-xs text-muted-400 mt-2">
                  Transfer bank · QRIS · GoPay · OVO
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5">
        <p className="font-body text-sm text-muted-500 text-center">
          Setelah pembayaran dikonfirmasi, paket aktif otomatis.
          Butuh bantuan?{' '}
          <a href="https://wa.me/6208970120687" target="_blank" className="text-primary-700 font-medium hover:underline">
            Chat kami via WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}
