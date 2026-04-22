import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Croissant, Shield, Search, ToggleLeft, ToggleRight,
  Loader2, Users, Package, ShoppingBag, MapPin,
  TrendingUp, AlertTriangle, RefreshCw, LogOut,
} from 'lucide-react'
import { adminService, type TenantSummary } from '../../services/adminService'
import { formatCurrency, cn } from '../../lib/utils'

const PLANS = ['basic', 'pro', 'enterprise']

export default function AdminPanelPage() {
  const [adminKey, setAdminKey] = useState(localStorage.getItem('admin_key') ?? '')
  const [inputKey, setInputKey] = useState('')
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const qc = useQueryClient()

  const isLoggedIn = !!adminKey

  const { data: tenants = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-tenants', adminKey],
    queryFn: () => adminService.getTenants(adminKey),
    enabled: isLoggedIn,
    retry: false,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { isActive?: boolean; plan?: string } }) =>
      adminService.updateTenant(adminKey, id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tenants'] }),
  })

  const handleLogin = () => {
    localStorage.setItem('admin_key', inputKey)
    setAdminKey(inputKey)
    setInputKey('')
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_key')
    setAdminKey('')
    qc.removeQueries({ queryKey: ['admin-tenants'] })
  }

  const filtered = tenants.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                        t.slug.toLowerCase().includes(search.toLowerCase())
    const matchPlan = !filterPlan || t.plan === filterPlan
    const matchActive = filterActive === 'all' ? true :
                        filterActive === 'active' ? t.isActive : !t.isActive
    return matchSearch && matchPlan && matchActive
  })

  const totalRevenue = tenants.reduce((s, t) => s + t.monthlyRevenue, 0)
  const activeTenants = tenants.filter((t) => t.isActive).length

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-oven-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-crust-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-crust-600" />
            </div>
            <h1 className="font-display text-xl font-semibold text-oven-800">Admin Panel</h1>
            <p className="font-body text-sm text-crust-400 mt-1">Roti POS Platform</p>
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
              Admin Key
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Masukkan admin key"
              className="input"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && inputKey) handleLogin() }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={!inputKey}
            className="btn-primary w-full"
          >
            Masuk
          </button>
        </div>
      </div>
    )
  }

  // ── Error — wrong key ─────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-oven-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 space-y-4 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h2 className="font-display text-lg font-semibold text-oven-800">Admin key salah</h2>
          <button onClick={handleLogout} className="btn-primary w-full">Coba lagi</button>
        </div>
      </div>
    )
  }

  // ── Main panel ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-crust-50">
      {/* Top bar */}
      <div className="bg-oven-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-crust-600 rounded-xl flex items-center justify-center">
            <Croissant className="w-4 h-4 text-cream" />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-cream">Roti POS</p>
            <p className="font-body text-xs text-crust-300">Admin Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-crust-300 hover:text-cream text-sm font-body transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-crust-300 hover:text-red-400 text-sm font-body transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Platform stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Tenant', value: tenants.length, icon: Users, color: 'bg-crust-100 text-crust-600' },
            { label: 'Tenant Aktif', value: activeTenants, icon: ToggleRight, color: 'bg-green-100 text-green-600' },
            { label: 'Revenue Bulan Ini', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'bg-dough-100 text-dough-600' },
            { label: 'Total Transaksi', value: tenants.reduce((s, t) => s + t.transactionCount, 0).toLocaleString(), icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between mb-2">
                <p className="font-body text-xs text-crust-400">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="font-display text-xl font-semibold text-oven-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-crust-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau slug..."
              className="input pl-9"
            />
          </div>
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="input w-36">
            <option value="">Semua paket</option>
            {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex bg-dough-100 rounded-xl p-1 gap-1">
            {(['all', 'active', 'inactive'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterActive(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all',
                  filterActive === s ? 'bg-white text-oven-800 shadow-warm' : 'text-crust-500 hover:text-crust-700'
                )}
              >
                {s === 'all' ? 'Semua' : s === 'active' ? 'Aktif' : 'Nonaktif'}
              </button>
            ))}
          </div>
        </div>

        {/* Tenant table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dough-100 bg-dough-50">
                  {['Tenant', 'Paket', 'Statistik', 'Revenue (bulan ini)', 'Terakhir aktif', 'Status'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-body text-xs font-semibold text-crust-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dough-100">
                {filtered.map((tenant) => (
                  <TenantRow
                    key={tenant.id}
                    tenant={tenant}
                    onToggleActive={() => updateMutation.mutate({ id: tenant.id, payload: { isActive: !tenant.isActive } })}
                    onChangePlan={(plan) => updateMutation.mutate({ id: tenant.id, payload: { plan } })}
                    isPending={updateMutation.isPending}
                  />
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-32 text-crust-300">
                <p className="font-body text-sm">Tidak ada tenant ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TenantRow({ tenant, onToggleActive, onChangePlan, isPending }: {
  tenant: TenantSummary
  onToggleActive: () => void
  onChangePlan: (plan: string) => void
  isPending: boolean
}) {
  const lastActive = tenant.lastActivityAt
    ? new Date(tenant.lastActivityAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  const daysSinceActivity = tenant.lastActivityAt
    ? Math.floor((Date.now() - new Date(tenant.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <tr className="hover:bg-dough-50 transition-colors">
      <td className="px-5 py-3">
        <p className="font-body text-sm font-semibold text-oven-800">{tenant.name}</p>
        <p className="font-mono text-xs text-crust-400">{tenant.slug}</p>
        <p className="font-body text-xs text-crust-400 mt-0.5">
          Bergabung {new Date(tenant.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
        </p>
      </td>

      <td className="px-5 py-3">
        <select
          value={tenant.plan}
          onChange={(e) => onChangePlan(e.target.value)}
          disabled={isPending}
          className="input text-xs py-1.5 w-28"
        >
          {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </td>

      <td className="px-5 py-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-body text-xs text-crust-600">
            <Users className="w-3 h-3" /> {tenant.userCount} user
          </div>
          <div className="flex items-center gap-1.5 font-body text-xs text-crust-600">
            <Package className="w-3 h-3" /> {tenant.productCount} produk
          </div>
          <div className="flex items-center gap-1.5 font-body text-xs text-crust-600">
            <MapPin className="w-3 h-3" /> {tenant.outletCount} outlet
          </div>
          <div className="flex items-center gap-1.5 font-body text-xs text-crust-600">
            <ShoppingBag className="w-3 h-3" /> {tenant.transactionCount} transaksi
          </div>
        </div>
      </td>

      <td className="px-5 py-3">
        <p className="font-display text-base font-semibold text-oven-800">
          {formatCurrency(tenant.monthlyRevenue)}
        </p>
      </td>

      <td className="px-5 py-3">
        <p className="font-body text-sm text-oven-700">{lastActive}</p>
        {daysSinceActivity !== null && daysSinceActivity > 7 && (
          <span className="font-body text-xs text-amber-600 flex items-center gap-1 mt-0.5">
            <AlertTriangle className="w-3 h-3" />
            {daysSinceActivity} hari tidak aktif
          </span>
        )}
      </td>

      <td className="px-5 py-3">
        <button
          onClick={onToggleActive}
          disabled={isPending}
          className="flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          {tenant.isActive ? (
            <>
              <ToggleRight className="w-5 h-5 text-green-500" />
              <span className="font-body text-xs text-green-600">Aktif</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-crust-300" />
              <span className="font-body text-xs text-crust-400">Nonaktif</span>
            </>
          )}
        </button>
      </td>
    </tr>
  )
}
