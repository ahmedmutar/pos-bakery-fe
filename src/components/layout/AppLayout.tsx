import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import Header from './Header'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useOnboarding } from '../../hooks/useOnboarding'
import OnboardingWizard from '../onboarding/OnboardingWizard'

const pageTitles: Record<string, string> = {
  '/app/dashboard':  'nav.dashboard',
  '/app/cashier':    'nav.cashier',
  '/app/products':   'nav.products',
  '/app/inventory':  'nav.inventory',
  '/app/recipes':    'nav.recipes',
  '/app/production': 'nav.production',
  '/app/forecast':   'nav.forecast',
  '/app/orders':     'nav.orders',
  '/app/reports':    'nav.reports',
  '/app/settings':   'nav.settings',
}

export default function AppLayout() {
  const location = useLocation()
  const { t } = useTranslation()
  const { show, complete } = useOnboarding()

  useWebSocket()

  const titleKey = pageTitles[location.pathname] || 'nav.dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-crust-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={t(titleKey)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>

      {show && <OnboardingWizard onComplete={complete} />}
    </div>
  )
}
