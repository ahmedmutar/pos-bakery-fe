import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowLeft, Zap, Building2, Rocket } from 'lucide-react'
import { usePlan, PLAN_LABELS } from '../hooks/usePlan'
import { cn } from '../lib/utils'

const PLANS = [
  {
    key: 'basic',
    icon: Zap,
    name: 'Basic',
    price: 'Rp 149.000',
    period: '/bulan',
    desc: 'Untuk bakery kecil yang baru mulai',
    color: 'border-dough-300',
    features: [
      '1 outlet',
      '3 staff',
      '50 produk',
      'Kasir & shift',
      'Laporan penjualan',
      'Pre-order',
    ],
  },
  {
    key: 'pro',
    icon: Rocket,
    name: 'Pro',
    price: 'Rp 349.000',
    period: '/bulan',
    desc: 'Untuk bakery yang sedang berkembang',
    color: 'border-crust-500',
    badge: 'Paling Populer',
    features: [
      'Hingga 5 outlet',
      '10 staff',
      'Produk tidak terbatas',
      'Semua fitur Basic',
      'Forecast produksi',
      'Import Excel',
      'Manajemen resep & food cost',
    ],
  },
  {
    key: 'enterprise',
    icon: Building2,
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Untuk jaringan bakery & franchise',
    color: 'border-oven-600',
    features: [
      'Outlet tidak terbatas',
      'Staff tidak terbatas',
      'Semua fitur Pro',
      'White label',
      'API access',
      'Dedicated support',
      'SLA guaranteed',
    ],
  },
]

export default function UpgradePage() {
  const navigate = useNavigate()
  const { data: plan } = usePlan()

  const currentPlan = plan?.plan ?? 'basic'
  const daysLeft = plan?.trial.daysLeft ?? 0
  const isExpired = plan?.trial.expired ?? false

  const handleUpgrade = (planKey: string) => {
    if (planKey === 'enterprise') {
      window.open('https://wa.me/6285947566558?text=Halo, saya ingin upgrade ke paket Enterprise', '_blank')
    } else {
      window.open('https://wa.me/6285947566558?text=Halo, saya ingin upgrade ke paket ' + planKey, '_blank')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-dough-100 transition-colors text-crust-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-oven-800">Upgrade Paket</h1>
          <p className="font-body text-sm text-crust-400 mt-0.5">
            Paket saat ini: <span className="font-semibold text-crust-600">{PLAN_LABELS[currentPlan]}</span>
            {plan?.trial.isOnTrial && !isExpired && (
              <span className="ml-2 text-amber-600">· {daysLeft} hari trial tersisa</span>
            )}
            {isExpired && (
              <span className="ml-2 text-red-500">· Trial sudah berakhir</span>
            )}
          </p>
        </div>
      </div>

      {/* Expired warning */}
      {isExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
          <div>
            <p className="font-body text-sm font-semibold text-red-700">Trial Anda telah berakhir</p>
            <p className="font-body text-sm text-red-600 mt-0.5">
              Pilih paket di bawah dan hubungi kami untuk aktivasi. Data Anda tetap aman.
            </p>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(({ key, icon: Icon, name, price, period, desc, color, badge, features }) => {
          const isCurrent = key === currentPlan && !isExpired && !plan?.trial.isOnTrial

          return (
            <div
              key={key}
              className={cn(
                'relative rounded-2xl border-2 p-6 bg-white flex flex-col shadow-warm',
                color,
                isCurrent && 'ring-2 ring-crust-400 ring-offset-2'
              )}
            >
              {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-crust-600 text-cream text-xs font-body font-semibold px-4 py-1.5 rounded-full">
                    {badge}
                  </span>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-full">
                    Paket Aktif
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-dough-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-crust-600" />
                </div>
                <h3 className="font-display text-lg font-bold text-oven-800">{name}</h3>
              </div>

              <p className="font-body text-xs text-crust-400 mb-4">{desc}</p>

              <div className="mb-5">
                <span className="font-display text-2xl font-bold text-oven-800">{price}</span>
                {period && <span className="font-body text-sm text-crust-400">{period}</span>}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-body text-sm text-crust-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(key)}
                disabled={isCurrent}
                className={cn(
                  'w-full py-2.5 rounded-xl font-body font-semibold text-sm transition-all',
                  isCurrent
                    ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                    : badge
                    ? 'bg-crust-600 text-cream hover:bg-crust-700'
                    : 'bg-dough-100 text-crust-700 hover:bg-dough-200 border border-dough-300'
                )}
              >
                {isCurrent ? 'Paket Saat Ini' : key === 'enterprise' ? 'Hubungi Sales' : 'Upgrade via WhatsApp'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Contact */}
      <div className="bg-dough-50 border border-dough-200 rounded-2xl p-5 text-center">
        <p className="font-body text-sm text-crust-500">
          Butuh bantuan memilih paket? Hubungi kami di{' '}
          <a href="mailto:hello@rotipos.com" className="text-crust-700 font-medium underline">
            hello@rotipos.com
          </a>{' '}
          atau WhatsApp{' '}
          <a href="https://wa.me/6285947566558" className="text-crust-700 font-medium underline" target="_blank">
            0812-3456-7890
          </a>
        </p>
      </div>
    </div>
  )
}
