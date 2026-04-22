import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Store, Users, MapPin, Shield, Package } from 'lucide-react'
import { cn } from '../lib/utils'
import ProfileSection from '../components/settings/ProfileSection'
import UsersSection from '../components/settings/UsersSection'
import OutletsSection from '../components/settings/OutletsSection'
import SecuritySection from '../components/settings/SecuritySection'
import OutletProductSettings from '../components/settings/OutletProductSettings'
import { outletApi } from '../services/outletService'
import { useAuthStore } from '../stores/authStore'

type Tab = 'profile' | 'users' | 'outlets' | 'products' | 'security'

const TABS: { key: Tab; labelKey: string; icon: typeof Store; ownerOnly?: boolean }[] = [
  { key: 'profile',  labelKey: 'settings.profile',  icon: Store,    ownerOnly: true },
  { key: 'users',    labelKey: 'settings.users',    icon: Users,    ownerOnly: true },
  { key: 'outlets',  labelKey: 'settings.outlets',  icon: MapPin,   ownerOnly: true },
  { key: 'products', labelKey: 'settings.products', icon: Package,  ownerOnly: true },
  { key: 'security', labelKey: 'settings.security', icon: Shield },
]

export default function SettingsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('profile')
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.role === 'OWNER'

  // Non-owner only sees security tab
  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isOwner)

  return (
    <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
      {/* Sidebar nav */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {visibleTabs.map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all',
                tab === key
                  ? 'bg-crust-600 text-cream shadow-warm'
                  : 'text-crust-600 hover:bg-dough-100'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {t(labelKey)}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {tab === 'profile'  && <ProfileSection />}
        {tab === 'users'    && <UsersSection />}
        {tab === 'outlets'  && <OutletsSection />}
        {tab === 'products' && <OutletProductTabContent />}
        {tab === 'security' && <SecuritySection />}
      </div>
    </div>
  )
}

function OutletProductTabContent() {
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null)
  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: outletApi.list,
  })

  const activeOutlet = outlets.find((o) => o.id === selectedOutletId) ?? outlets[0]

  if (outlets.length === 0) {
    return (
      <div className="card flex items-center justify-center h-32">
        <p className="font-body text-sm text-crust-400">Belum ada outlet. Tambah outlet di tab Outlet & Cabang.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {outlets.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {outlets.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelectedOutletId(o.id)}
              className={`px-4 py-2 rounded-xl font-body text-sm font-medium transition-all border ${
                (activeOutlet?.id === o.id)
                  ? 'bg-crust-600 text-cream border-crust-600'
                  : 'bg-white text-crust-600 border-dough-200 hover:bg-dough-50'
              }`}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      {activeOutlet && (
        <OutletProductSettings
          key={activeOutlet.id}
          outletId={activeOutlet.id}
          outletName={activeOutlet.name}
        />
      )}
    </div>
  )
}
