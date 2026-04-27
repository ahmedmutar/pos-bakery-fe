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

  // Expired
  if (trial.expired) {
    return (
      <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm font-body">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            Trial Anda telah berakhir. Upgrade sekarang untuk melanjutkan menggunakan Roti POS.
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

  // Trial active — only show if ≤ 7 days left
  if (!trial.isOnTrial || trial.daysLeft > 7) return null

  const urgent = trial.daysLeft <= 3

  return (
    <div className={cn(
      'px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0',
      urgent ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
    )}>
      <div className="flex items-center gap-2 text-sm font-body">
        <Zap className="w-4 h-4 flex-shrink-0" />
        <span>
          Trial berakhir dalam <strong>{trial.daysLeft} hari</strong>.
          {urgent ? ' Segera upgrade agar data Anda tidak terhenti.' : ' Upgrade untuk melanjutkan tanpa gangguan.'}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate('/app/upgrade')}
          className="bg-white text-amber-600 font-body font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
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
