import { useState } from 'react'
import { usePlan, PLAN_LABELS, PLAN_COLORS, type PlanLimits, FEATURE_REQUIRED_PLAN } from '../../hooks/usePlan'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, ShoppingCart, ChefHat, Package, ClipboardCheck,
  BookOpen, ClipboardList, BarChart3, Settings,
  LogOut, UtensilsCrossed, Sparkles, Menu, X, Receipt, Ticket, Users, Radio, ShoppingBag, Lock,
} from 'lucide-react'
import { useAuthStore, type AuthUser } from '../../stores/authStore'
import { authApi } from '../../services/authService'
import { SajiinIcon } from '../ui/SajiinLogo'
import { cn } from '../../lib/utils'

type Role = 'OWNER' | 'CASHIER' | 'PRODUCTION'

interface NavItem {
  key: string
  icon: React.ElementType
  path: string
  allow: Role[]
  planFeature?: keyof PlanLimits  // if set, show lock when feature not available
}

const navItems: NavItem[] = [
  { key: 'dashboard',      icon: LayoutDashboard, path: '/app/dashboard',      allow: ['OWNER', 'CASHIER', 'PRODUCTION'] },
  { key: 'cashier',        icon: ShoppingCart,    path: '/app/cashier',         allow: ['OWNER', 'CASHIER'] },
  { key: 'products',       icon: UtensilsCrossed, path: '/app/products',        allow: ['OWNER', 'PRODUCTION'] },
  { key: 'inventory',      icon: Package,         path: '/app/inventory',       allow: ['OWNER', 'PRODUCTION'],  planFeature: 'hasInventory' },
  { key: 'stockOpname',    icon: ClipboardCheck,  path: '/app/stock-opname',    allow: ['OWNER', 'PRODUCTION'],  planFeature: 'hasExcelImport' },
  { key: 'recipes',        icon: BookOpen,        path: '/app/recipes',         allow: ['OWNER', 'PRODUCTION'],  planFeature: 'hasRecipes' },
  { key: 'production',     icon: ChefHat,         path: '/app/production',      allow: ['OWNER', 'PRODUCTION'],  planFeature: 'hasProduction' },
  { key: 'forecast',       icon: Sparkles,        path: '/app/forecast',        allow: ['OWNER', 'PRODUCTION'],  planFeature: 'hasForecast' },
  { key: 'orders',         icon: ClipboardList,   path: '/app/orders',          allow: ['OWNER', 'CASHIER', 'PRODUCTION'] },
  { key: 'reports',        icon: BarChart3,       path: '/app/reports',         allow: ['OWNER', 'CASHIER'] },
  { key: 'expenses',       icon: Receipt,         path: '/app/expenses',        allow: ['OWNER'],               planFeature: 'hasExpenses' },
  { key: 'vouchers',       icon: Ticket,          path: '/app/vouchers',        allow: ['OWNER'] },
  { key: 'customers',      icon: Users,           path: '/app/customers',       allow: ['OWNER', 'CASHIER'],    planFeature: 'hasCustomers' },
  { key: 'broadcast',      icon: Radio,           path: '/app/broadcast',       allow: ['OWNER'],               planFeature: 'hasBroadcast' },
  { key: 'purchaseOrders', icon: ShoppingBag,     path: '/app/purchase-orders', allow: ['OWNER'],               planFeature: 'hasPurchaseOrders' },
  { key: 'resellers',      icon: Users,           path: '/app/resellers',       allow: ['OWNER'],               planFeature: 'hasResellers' },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { data: planData } = usePlan()
  const typedUser = user as AuthUser | null

  const role = (typedUser?.role ?? 'CASHIER') as Role
  const visibleItems = navItems.filter((item) => item.allow.includes(role))

  const ROLE_LABELS: Record<Role, string> = {
    OWNER: t('role.OWNER'), CASHIER: t('role.CASHIER'), PRODUCTION: t('role.PRODUCTION'),
  }

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    navigate('/login')
  }

  const handleNav = () => onClose?.()

  // Check if a nav item's feature is locked
  function isLocked(item: NavItem): boolean {
    if (!item.planFeature || !planData) return false
    const val = planData.limits[item.planFeature]
    return typeof val === 'boolean' && !val
  }

  // Label for required plan on locked items
  function lockedLabel(item: NavItem): string {
    if (!item.planFeature) return ''
    const req = FEATURE_REQUIRED_PLAN[item.planFeature]
    return req ? PLAN_LABELS[req] : ''
  }

  return (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-200 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          {typedUser?.logoUrl ? (
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
              <img src={typedUser.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <SajiinIcon size={36} className="flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold text-dark-800 leading-tight tracking-tight truncate">
              {typedUser?.tenantName ?? 'Sajiin'}
            </p>
            <p className="font-body text-[10px] text-muted-400 leading-tight uppercase tracking-widest truncate">
              {typedUser?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const locked = isLocked(item)
          const reqLabel = lockedLabel(item)

          return (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={handleNav}
              className={({ isActive }) =>
                cn('sidebar-item', isActive && 'active', locked && 'opacity-60')
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{t(`nav.${item.key}`)}</span>
              {locked && (
                <span className="flex items-center gap-0.5 ml-auto flex-shrink-0">
                  <Lock className="w-3 h-3 text-muted-400" />
                  <span className="font-body text-[9px] text-muted-400 font-medium leading-none">
                    {reqLabel}
                  </span>
                </span>
              )}
            </NavLink>
          )
        })}

        <NavLink
          to="/app/settings"
          onClick={handleNav}
          className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span>{t('nav.settings')}</span>
        </NavLink>
      </nav>

      {/* Plan badge */}
      <div className="px-3 pb-2">
        <button
          onClick={() => { navigate('/app/upgrade'); onClose?.() }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-50 hover:bg-surface-100 transition-colors border border-surface-200"
        >
          <PlanBadge />
        </button>
      </div>

      {/* Bottom user info */}
      <div className="px-3 py-4 border-t border-surface-200 space-y-1 flex-shrink-0">
        <div className="px-4 py-2">
          <p className="font-body text-xs font-medium text-dark-700 truncate">{typedUser?.name}</p>
          <p className="font-body text-xs text-muted-400 truncate">{typedUser?.tenantName}</p>
          <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-surface-100 text-primary-600">
            {ROLE_LABELS[role]}
          </span>
        </div>
        <button onClick={handleLogout} className="sidebar-item w-full">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>{t('auth.logout')}</span>
        </button>
      </div>
    </>
  )
}


function PlanBadge() {
  const { data: plan } = usePlan()
  if (!plan) return null
  const label = PLAN_LABELS[plan.plan] ?? plan.plan
  const color = PLAN_COLORS[plan.plan] ?? PLAN_COLORS.basic
  return (
    <div className="flex items-center justify-between w-full">
      <span className="font-body text-xs text-muted-500">Paket</span>
      <span className={`font-body text-xs font-semibold px-2 py-0.5 rounded-md border ${color}`}>
        {label}
        {plan.trial.isOnTrial && !plan.trial.expired && (
          <span className="ml-1 text-accent-500">· {plan.trial.daysLeft}h</span>
        )}
      </span>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] h-full bg-white border-r border-surface-200 flex-col shadow-warm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 w-9 h-9 bg-white border border-surface-200 rounded-xl
                   flex items-center justify-center shadow-warm text-primary-600 hover:bg-surface-50 transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-[260px] h-full bg-white flex flex-col shadow-warm-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg
                         text-muted-400 hover:text-primary-600 hover:bg-surface-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
