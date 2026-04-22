import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, ShoppingCart, ChefHat, Package,
  BookOpen, ClipboardList, BarChart3, Settings,
  Croissant, LogOut, UtensilsCrossed, Sparkles, Menu, X,
} from 'lucide-react'
import { useAuthStore, type AuthUser } from '../../stores/authStore'
import { authApi } from '../../services/authService'
import { cn } from '../../lib/utils'

type Role = 'OWNER' | 'CASHIER' | 'PRODUCTION'

interface NavItem {
  key: string
  icon: React.ElementType
  path: string
  allow: Role[]
}

const navItems: NavItem[] = [
  { key: 'dashboard',  icon: LayoutDashboard, path: '/app/dashboard',  allow: ['OWNER', 'CASHIER', 'PRODUCTION'] },
  { key: 'cashier',    icon: ShoppingCart,    path: '/app/cashier',    allow: ['OWNER', 'CASHIER'] },
  { key: 'products',   icon: UtensilsCrossed, path: '/app/products',   allow: ['OWNER', 'PRODUCTION'] },
  { key: 'inventory',  icon: Package,         path: '/app/inventory',  allow: ['OWNER', 'PRODUCTION'] },
  { key: 'recipes',    icon: BookOpen,        path: '/app/recipes',    allow: ['OWNER', 'PRODUCTION'] },
  { key: 'production', icon: ChefHat,         path: '/app/production', allow: ['OWNER', 'PRODUCTION'] },
  { key: 'forecast',   icon: Sparkles,        path: '/app/forecast',   allow: ['OWNER', 'PRODUCTION'] },
  { key: 'orders',     icon: ClipboardList,   path: '/app/orders',     allow: ['OWNER', 'CASHIER', 'PRODUCTION'] },
  { key: 'reports',    icon: BarChart3,       path: '/app/reports',    allow: ['OWNER', 'CASHIER'] },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
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

  return (
    <>
      {/* Logo */}
      <div className="px-4 py-5 border-b border-dough-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-crust-600 rounded-xl flex items-center justify-center shadow-warm overflow-hidden flex-shrink-0">
            {typedUser?.logoUrl ? (
              <img src={typedUser.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
            ) : (
              <Croissant className="w-5 h-5 text-cream" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-bold text-oven-800 leading-tight tracking-tight truncate">
              {typedUser?.tenantName ?? 'Roti POS'}
            </p>
            <p className="font-body text-[10px] text-crust-400 leading-tight uppercase tracking-widest truncate">
              {typedUser?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.key}
              to={item.path}
              onClick={handleNav}
              className={({ isActive }) =>
                cn('sidebar-item', isActive && 'active')
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{t(`nav.${item.key}`)}</span>
            </NavLink>
          )
        })}

        <NavLink
          to="/settings"
          onClick={handleNav}
          className={({ isActive }) => cn('sidebar-item', isActive && 'active')}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span>{t('nav.settings')}</span>
        </NavLink>
      </nav>

      {/* Bottom user info */}
      <div className="px-3 py-4 border-t border-dough-100 space-y-1 flex-shrink-0">
        <div className="px-4 py-2">
          <p className="font-body text-xs font-medium text-oven-700 truncate">{typedUser?.name}</p>
          <p className="font-body text-xs text-crust-400 truncate">{typedUser?.email}</p>
          <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-body font-medium bg-dough-100 text-crust-600">
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

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] h-full bg-white border-r border-dough-200 flex-col shadow-warm flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3.5 left-4 z-50 w-9 h-9 bg-white border border-dough-200 rounded-xl
                   flex items-center justify-center shadow-warm text-crust-600 hover:bg-dough-50 transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-oven-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-[260px] h-full bg-white flex flex-col shadow-warm-lg">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg
                         text-crust-400 hover:text-crust-600 hover:bg-dough-100 transition-colors"
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
