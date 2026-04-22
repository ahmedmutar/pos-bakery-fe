import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationPanel from './NotificationPanel'
import AvatarButton from './AvatarButton'
import { cn } from '../../lib/utils'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const { i18n } = useTranslation()
  const { notifications, urgentCount, totalCount } = useNotifications()
  const [showPanel, setShowPanel] = useState(false)

  const toggleLanguage = () => {
    const next = i18n.language === 'id' ? 'en' : 'id'
    i18n.changeLanguage(next)
    localStorage.setItem('language', next)
  }

  const now = new Intl.DateTimeFormat(i18n.language === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const isUAT = import.meta.env.VITE_APP_ENV === 'uat'

  return (
    <>
      {isUAT && (
        <div className="bg-amber-500 text-white text-center py-1.5 font-body text-xs font-semibold tracking-wide uppercase flex-shrink-0">
          ⚠ UAT Environment — Bukan untuk penggunaan nyata
        </div>
      )}
    <header className="h-16 bg-white border-b border-dough-200 px-4 lg:px-6 pl-16 lg:pl-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="font-display text-xl font-bold text-oven-800 tracking-tight">{title}</h1>
        <p className="font-body text-[11px] text-crust-400 tracking-wide uppercase hidden sm:block">{now}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1 rounded-lg bg-dough-100 border border-dough-200
                     text-crust-600 text-xs font-body font-medium hover:bg-dough-200 transition-colors"
        >
          {i18n.language === 'id' ? 'EN' : 'ID'}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowPanel((v) => !v)}
            className={cn(
              'w-9 h-9 rounded-xl border flex items-center justify-center transition-colors relative',
              showPanel
                ? 'bg-crust-600 border-crust-600 text-cream'
                : 'bg-dough-50 border-dough-200 text-crust-500 hover:bg-dough-100'
            )}
          >
            <Bell className="w-4 h-4" />
            {totalCount > 0 && (
              <span className={cn(
                'absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center',
                'text-[10px] font-body font-bold text-white px-1',
                urgentCount > 0 ? 'bg-red-500' : 'bg-crust-500'
              )}>
                {totalCount > 9 ? '9+' : totalCount}
              </span>
            )}
          </button>

          {showPanel && (
            <NotificationPanel
              notifications={notifications}
              onClose={() => setShowPanel(false)}
            />
          )}
        </div>

        {/* Avatar — click to upload/change photo or logout */}
        <AvatarButton />
      </div>
    </header>
    </>
  )
}
