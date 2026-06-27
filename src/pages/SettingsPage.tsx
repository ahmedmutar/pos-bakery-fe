import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Store, Users, MapPin, Shield, Package, Bell, Star, Globe, Lock, Printer } from 'lucide-react'
import { cn } from '../lib/utils'
import ProfileSection from '../components/settings/ProfileSection'
import UsersSection from '../components/settings/UsersSection'
import OutletsSection from '../components/settings/OutletsSection'
import SecuritySection from '../components/settings/SecuritySection'
import BankSection from '../components/settings/BankSection'
import QRISSection from '../components/settings/QRISSection'
import NotificationsSection from '../components/settings/NotificationsSection'
import LoyaltySection from '../components/settings/LoyaltySection'
import PublicOrderSection from '../components/settings/PublicOrderSection'
import PrinterSection from '../components/settings/PrinterSection'
import OutletProductSettings from '../components/settings/OutletProductSettings'
import { outletApi } from '../services/outletService'
import { useAuthStore } from '../stores/authStore'
import { usePlan, type PlanLimits } from '../hooks/usePlan'
import PlanGate from '../components/ui/PlanGate'

type Tab = 'profile' | 'users' | 'outlets' | 'products' | 'security' | 'bank' | 'qris' | 'printer' | 'notifications' | 'loyalty' | 'publicOrder'

const TABS: {
  key: Tab
  labelKey: string
  icon: typeof Store
  ownerOnly?: boolean
  planFeature?: keyof PlanLimits
}[] = [
  { key: 'profile',       labelKey: 'settings.profile',       icon: Store,    ownerOnly: true },
  { key: 'users',         labelKey: 'settings.users',         icon: Users,    ownerOnly: true },
  { key: 'outlets',       labelKey: 'settings.outlets',       icon: MapPin,   ownerOnly: true },
  { key: 'products',      labelKey: 'settings.products',      icon: Package,  ownerOnly: true },
  { key: 'security',      labelKey: 'settings.security',      icon: Shield },
  { key: 'bank',          labelKey: 'settings.bank',          icon: Shield,   ownerOnly: true },
  { key: 'qris',          labelKey: 'settings.qris',          icon: Shield,   ownerOnly: true },
  { key: 'printer',       labelKey: 'settings.printer',       icon: Printer,  ownerOnly: true },
  { key: 'notifications', labelKey: 'settings.notifications', icon: Bell,     ownerOnly: true, planFeature: 'hasWaNotifications' },
  { key: 'loyalty',       labelKey: 'settings.loyalty',       icon: Star,     ownerOnly: true, planFeature: 'hasLoyalty' },
  { key: 'publicOrder',   labelKey: 'settings.publicOrder',   icon: Globe,    ownerOnly: true, planFeature: 'hasPublicOrderLink' },
]

export default function SettingsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('profile')
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.role === 'OWNER'
  const { data: planData } = usePlan()

  // Non-owner only sees security tab
  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isOwner)

  function isTabLocked(tabDef: typeof TABS[0]): boolean {
    if (!tabDef.planFeature || !planData) return false
    const val = planData.limits[tabDef.planFeature]
    return typeof val === 'boolean' && !val
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
      {/* Sidebar nav */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {visibleTabs.map((tabDef) => {
            const { key, labelKey, icon: Icon } = tabDef
            const locked = isTabLocked(tabDef)
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all',
                  tab === key
                    ? 'bg-primary-600 text-white shadow-warm'
                    : 'text-primary-600 hover:bg-surface-100',
                  locked && 'opacity-60'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{t(labelKey)}</span>
                {locked && <Lock className="w-3 h-3 flex-shrink-0 opacity-70" />}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {tab === 'profile'  && <ProfileSection />}
        {tab === 'users'    && <UsersSection />}
        {tab === 'outlets'  && <OutletsSection />}
        {tab === 'products' && <OutletProductTabContent />}
        {tab === 'security' && <SecuritySection />}
        {tab === 'bank'     && <BankSection />}
        {tab === 'qris'     && <QRISSection />}
        {tab === 'printer'  && <PrinterSection />}
        {tab === 'notifications' && (
          <PlanGate feature="hasWaNotifications" featureName="Notifikasi WhatsApp">
            <NotificationsSection />
          </PlanGate>
        )}
        {tab === 'loyalty' && (
          <PlanGate feature="hasLoyalty" featureName="Program Loyalitas">
            <LoyaltySection />
          </PlanGate>
        )}
        {tab === 'publicOrder' && (
          <PlanGate feature="hasPublicOrderLink" featureName="Link Pre-Order Publik">
            <PublicOrderSection />
          </PlanGate>
        )}
      </div>
    </div>
  )
}

function OutletProductTabContent() {
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null)
  const { data: outlets, isLoading } = useQuery({
    queryKey: ['outlets'],
    queryFn: outletApi.list,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!outlets?.length) return (
    <div className="card p-6">
      <p className="font-body text-sm text-muted-400">Belum ada outlet. Tambah outlet di tab Outlet & Cabang.</p>
    </div>
  )

  const activeId = selectedOutletId ?? outlets[0].id
  const activeOutlet = outlets.find(o => o.id === activeId) ?? outlets[0]

  return (
    <div className="space-y-4">
      {outlets.length > 1 && (
        <div className="card p-4">
          <label className="block text-xs font-body font-medium text-muted-500 mb-1.5">Pilih Outlet</label>
          <select
            value={activeId}
            onChange={e => setSelectedOutletId(e.target.value)}
            className="input text-sm"
          >
            {outlets.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}
      <OutletProductSettings outletId={activeOutlet.id} outletName={activeOutlet.name} />
    </div>
  )
}
