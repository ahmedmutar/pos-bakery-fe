import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Zap, X } from 'lucide-react'
import { useState } from 'react'
import { usePlan } from '../../hooks/usePlan'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../lib/utils'

export default function TrialBanner() {
  const { data: plan } = usePlan()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  // Only show for OWNER
  if (user?.role !== 'OWNER') return null
  if (!plan) return null
  if (dismissed) return null

  const { trial } = plan
  const subDaysLeft = plan.subscription?.daysLeft ?? null
  const subExpired  = plan.subscription?.expired ?? false

  // Subscription habis (bukan trial)
  if (subExpired && !trial.isOnTrial) {
    return (
      <div className="bg-red-600 text-white px-4 sm:px-6 py-2 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-body">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Langganan Anda telah berakhir. Perpanjang sekarang agar toko tetap berjalan.</span>
        </div>
        <button onClick={() => navigate('/app/upgrade')}
          className="flex-shrink-0 bg-white text-red-600 font-body font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
          Perpanjang
        </button>
      </div>
    )
  }

  // Subscription mau habis (7 hari lagi)
  if (!trial.isOnTrial && subDaysLeft !== null && subDaysLeft <= 7 && !subExpired) {
    const urgentSub = subDaysLeft <= 3
    return (
      <div className={cn(
        'px-4 sm:px-6 py-2 flex items-center justify-between gap-4 flex-shrink-0',
        urgentSub ? 'bg-red-500 text-white' : 'bg-accent-400 text-white'
      )}>
        <div className="flex items-center gap-2 text-sm font-body">
          <Zap className="w-4 h-4 flex-shrink-0" />
          <span>Langganan berakhir dalam <strong>{subDaysLeft} hari</strong>. {urgentSub ? 'Segera perpanjang!' : 'Perpanjang sebelum terganggu.'}</span>
        </div>
        <button onClick={() => navigate('/app/upgrade')}
          className="flex-shrink-0 bg-white text-dark-700 font-body font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors">
          Perpanjang
        </button>
      </div>
    )
  }

  // Trial expired
  if (trial.expired) {
    return (
      <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-body">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            Trial Anda telah berakhir. Upgrade sekarang untuk melanjutkan menggunakan Sajiin.
          </span>
        </div>
        <button
          onClick={() => navigate('/app/upgrade')}
          className="flex-shrink-0 bg-white text-red-600 font-body font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          Upgrade Sekarang
        </button>
      </div>
    )
  }

  // Trial active — tampil selama masih trial
  if (!trial.isOnTrial) return null

  const urgent  = trial.daysLeft <= 3
  const warning = trial.daysLeft <= 7

  return (
    <div className={cn(
      'px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0',
      urgent  ? 'bg-red-500 text-white' :
      warning ? 'bg-accent-400 text-white' :
                'bg-primary-600 text-white'
    )}>
      <div className="flex items-center gap-2 text-sm font-body">
        <Zap className="w-4 h-4 flex-shrink-0" />
        <span>
          {urgent
            ? <>Trial berakhir dalam <strong>{trial.daysLeft} hari</strong>. Segera upgrade agar data tidak terhenti.</>
            : warning
            ? <>Trial berakhir dalam <strong>{trial.daysLeft} hari</strong>. Upgrade sebelum akses terbatas.</>
            : <>Anda sedang dalam masa trial gratis. Sisa <strong>{trial.daysLeft} hari</strong>.</>
          }
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate('/app/upgrade')}
          className="bg-white text-dark-600 font-body font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
        >
          Lihat Paket
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
