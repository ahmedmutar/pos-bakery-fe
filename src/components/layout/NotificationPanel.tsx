import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Calendar, Package, X, CheckCircle } from 'lucide-react'
import type { Notification } from '../../hooks/useNotifications'
import { cn } from '../../lib/utils'

interface NotificationPanelProps {
  notifications: Notification[]
  onClose: () => void
}

const TYPE_CONFIG = {
  low_stock: {
    icon: Package,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    route: '/inventory',
  },
  pickup_today: {
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    route: '/orders',
  },
  pickup_overdue: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    route: '/orders',
  },
}

export default function NotificationPanel({ notifications, onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleClick = (route: string) => {
    navigate(route)
    onClose()
  }

  // Group by type
  const overdue = notifications.filter((n) => n.type === 'pickup_overdue')
  const lowStock = notifications.filter((n) => n.type === 'low_stock')
  const today = notifications.filter((n) => n.type === 'pickup_today')

  const groups = [
    { label: 'Pesanan terlambat', items: overdue },
    { label: 'Stok menipis', items: lowStock },
    { label: 'Pengambilan hari ini', items: today },
  ].filter((g) => g.items.length > 0)

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-72 sm:w-80 bg-white rounded-2xl shadow-warm-lg border border-surface-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
        <p className="font-display text-sm font-semibold text-dark-800">Notifikasi</p>
        <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-surface-300">
            <CheckCircle className="w-8 h-8" />
            <p className="font-body text-sm">Semua aman</p>
          </div>
        ) : (
          <div className="py-2">
            {groups.map(({ label, items }) => (
              <div key={label}>
                <p className="font-body text-xs font-semibold text-muted-400 uppercase tracking-wide px-4 py-2">
                  {label}
                </p>
                {items.map((notif) => {
                  const config = TYPE_CONFIG[notif.type]
                  const Icon = config.icon
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(config.route)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                        'hover:bg-surface-50 border-b border-surface-50 last:border-0'
                      )}
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        config.bg, config.border, 'border'
                      )}>
                        <Icon className={cn('w-4 h-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-body text-xs font-semibold',
                          notif.urgent ? 'text-red-600' : 'text-dark-800'
                        )}>
                          {notif.title}
                        </p>
                        <p className="font-body text-xs text-muted-500 mt-0.5 truncate">
                          {notif.message}
                        </p>
                      </div>
                      {notif.urgent && (
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-surface-200 bg-surface-50">
          <p className="font-body text-xs text-muted-400 text-center">
            {notifications.length} notifikasi aktif · diperbarui tiap 2 menit
          </p>
        </div>
      )}
    </div>
  )
}
