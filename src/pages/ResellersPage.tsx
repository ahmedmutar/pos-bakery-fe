import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, X, Loader2, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { resellerApi, TIER_CONFIG, type Reseller, type ResellerTier, type CreateResellerPayload } from '../services/resellerService'
import { formatCurrency, cn } from '../lib/utils'
import { useAuthStore } from '../stores/authStore'

const TIERS: ResellerTier[] = ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']

export default function ResellersPage() {
  const qc = useQueryClient()
  const user = useAuthStore(s => s.user)
  const isOwner = user?.role === 'OWNER'

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Reseller | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const { data: resellers = [], isLoading } = useQuery({
    queryKey: ['resellers', showInactive],
    queryFn: () => resellerApi.list(showInactive),
  })

  const { data: stats } = useQuery({
    queryKey: ['reseller-stats'],
    queryFn: resellerApi.stats,
    enabled: isOwner,
  })

  const { data: detail } = useQuery({
    queryKey: ['reseller-detail', expandedId],
    queryFn: () => resellerApi.get(expandedId!),
    enabled: !!expandedId,
  })

  const toggleMutation = useMutation({
    mutationFn: resellerApi.toggleActive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resellers'] }),
  })

  // Summary cards
  const totalSales = resellers.reduce((s, r) => s + r.totalSales, 0)
  const totalCommission = resellers.reduce((s, r) => s + r.totalCommission, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Reseller & Agen
          </h1>
          <p className="font-body text-sm text-muted-400 mt-0.5">Kelola agen penjualan dan komisi mereka</p>
        </div>
        {isOwner && (
          <button onClick={() => { setEditTarget(null); setShowForm(true) }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Reseller
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="font-body text-xs text-muted-400">Total Reseller</p>
          <p className="font-display text-2xl font-bold text-dark-800">{resellers.filter(r => r.isActive).length}</p>
        </div>
        <div className="card p-4">
          <p className="font-body text-xs text-muted-400">Total Penjualan</p>
          <p className="font-display text-lg font-bold text-dark-800">{formatCurrency(totalSales)}</p>
        </div>
        <div className="card p-4">
          <p className="font-body text-xs text-muted-400">Total Komisi</p>
          <p className="font-display text-lg font-bold text-primary-600">{formatCurrency(totalCommission)}</p>
        </div>
        <div className="card p-4">
          <p className="font-body text-xs text-muted-400">Pesanan Online</p>
          <p className="font-display text-2xl font-bold text-dark-800">{stats?.recentOrders ?? '-'}</p>
        </div>
      </div>

      {/* Tier filter + inactive toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {TIERS.map(tier => {
            const count = resellers.filter(r => r.tier === tier).length
            if (count === 0) return null
            return (
              <span key={tier} className={cn('text-xs font-body font-medium px-2.5 py-1 rounded-full', TIER_CONFIG[tier].color)}>
                {TIER_CONFIG[tier].label} ({count})
              </span>
            )
          })}
        </div>
        <label className="flex items-center gap-2 text-xs font-body text-muted-500 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
          Tampilkan non-aktif
        </label>
      </div>

      {/* Form modal */}
      {showForm && (
        <ResellerFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null) }}
          onSave={async (data) => {
            if (editTarget) {
              await resellerApi.update(editTarget.id, data)
            } else {
              await resellerApi.create(data as CreateResellerPayload)
            }
            qc.invalidateQueries({ queryKey: ['resellers'] })
            qc.invalidateQueries({ queryKey: ['reseller-stats'] })
            setShowForm(false)
            setEditTarget(null)
          }}
        />
      )}

      {/* Reseller list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-muted-400 animate-spin" /></div>
      ) : resellers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="font-body text-sm text-muted-400">Belum ada reseller terdaftar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resellers.map(reseller => {
            const tierCfg = TIER_CONFIG[reseller.tier as ResellerTier]
            const isExpanded = expandedId === reseller.id

            return (
              <div key={reseller.id} className={cn('card overflow-hidden', !reseller.isActive && 'opacity-60')}>
                <div className="p-4 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-sm font-bold text-primary-700">
                      {reseller.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body text-sm font-semibold text-dark-800">{reseller.name}</p>
                      <span className={cn('text-xs font-body font-medium px-2 py-0.5 rounded-full', tierCfg.color)}>
                        {tierCfg.label}
                      </span>
                      {!reseller.isActive && (
                        <span className="text-xs font-body text-muted-400 bg-surface-100 px-2 py-0.5 rounded-full">Non-aktif</span>
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-400 mt-0.5">{reseller.phone}{reseller.email ? ` · ${reseller.email}` : ''}</p>
                  </div>

                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="font-body text-xs text-muted-400">Penjualan</p>
                    <p className="font-display text-sm font-bold text-dark-800">{formatCurrency(reseller.totalSales)}</p>
                    <p className="font-body text-xs text-primary-600">Komisi: {formatCurrency(reseller.totalCommission)}</p>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditTarget(reseller); setShowForm(true) }}
                        className="btn-secondary px-2 py-1.5 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : reseller.id)}
                        className="text-muted-400 hover:text-primary-600 p-1.5"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-surface-100 p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-surface-50 rounded-xl p-3 text-center">
                        <p className="font-body text-xs text-muted-400">Diskon</p>
                        <p className="font-display text-lg font-bold text-dark-800">{reseller.discountPct}%</p>
                      </div>
                      <div className="bg-surface-50 rounded-xl p-3 text-center">
                        <p className="font-body text-xs text-muted-400">Komisi</p>
                        <p className="font-display text-lg font-bold text-primary-600">{reseller.commissionPct}%</p>
                      </div>
                      <div className="bg-surface-50 rounded-xl p-3 text-center">
                        <p className="font-body text-xs text-muted-400">Total Sales</p>
                        <p className="font-body text-sm font-bold text-dark-800">{formatCurrency(reseller.totalSales)}</p>
                      </div>
                      <div className="bg-surface-50 rounded-xl p-3 text-center">
                        <p className="font-body text-xs text-muted-400">Total Komisi</p>
                        <p className="font-body text-sm font-bold text-green-700">{formatCurrency(reseller.totalCommission)}</p>
                      </div>
                    </div>

                    {/* Recent pre-orders */}
                    {detail?.preOrders && detail.preOrders.length > 0 && (
                      <div>
                        <p className="font-body text-xs font-semibold text-muted-500 mb-2">Pesanan Terbaru</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                          {detail.preOrders.slice(0, 10).map(po => (
                            <div key={po.id} className="flex justify-between items-center text-xs font-body bg-surface-50 rounded-lg px-3 py-2">
                              <span className="text-dark-700 truncate flex-1">{po.customerName}</span>
                              <span className="text-muted-400 mx-2">{new Date(po.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                              <span className="font-semibold text-dark-800">{formatCurrency(po.total)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMutation.mutate(reseller.id)}
                        disabled={toggleMutation.isPending}
                        className={cn('btn-secondary text-xs', reseller.isActive ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700')}
                      >
                        {reseller.isActive ? 'Nonaktifkan' : 'Aktifkan kembali'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Reseller Form Modal ───────────────────────────────────────────────────────
interface ResellerFormModalProps {
  initial: Reseller | null
  onClose: () => void
  onSave: (data: Partial<CreateResellerPayload> & { tier?: ResellerTier; discountPct?: number; commissionPct?: number }) => Promise<void>
}

function ResellerFormModal({ initial, onClose, onSave }: ResellerFormModalProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [tier, setTier] = useState<ResellerTier>(initial?.tier as ResellerTier ?? 'STANDARD')
  const [discountPct, setDiscountPct] = useState(String(initial?.discountPct ?? 0))
  const [commissionPct, setCommissionPct] = useState(String(initial?.commissionPct ?? TIER_CONFIG[initial?.tier as ResellerTier ?? 'STANDARD'].defaultCommission))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleTierChange(t: ResellerTier) {
    setTier(t)
    setCommissionPct(String(TIER_CONFIG[t].defaultCommission))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        tier,
        discountPct: parseInt(discountPct) || 0,
        commissionPct: parseInt(commissionPct) || 0,
      })
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-warm-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-dark-800">
            {initial ? 'Edit Reseller' : 'Tambah Reseller'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Nama *</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Nama reseller" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">No. HP *</label>
              <input required value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="08xxxxxxxxxx" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1">Email (opsional)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="email@contoh.com" />
          </div>

          {/* Tier selector */}
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-2">Tier</label>
            <div className="grid grid-cols-4 gap-2">
              {TIERS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTierChange(t)}
                  className={cn(
                    'py-2 rounded-xl border text-xs font-body font-medium transition-all text-center',
                    tier === t ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-surface-200 text-muted-600 hover:border-primary-300'
                  )}
                >
                  <Star className={cn('w-3 h-3 mx-auto mb-0.5', t === 'GOLD' || t === 'PLATINUM' ? 'text-amber-500' : 'text-muted-300')} />
                  {TIER_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Diskon Harga (%)</label>
              <input type="number" min={0} max={100} value={discountPct} onChange={e => setDiscountPct(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Komisi (%)</label>
              <input type="number" min={0} max={100} value={commissionPct} onChange={e => setCommissionPct(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1">Catatan (opsional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="input" placeholder="Wilayah, keterangan, dll" />
          </div>

          {error && <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
        </form>

        <div className="px-5 py-4 border-t border-surface-200 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={e => handleSubmit(e as unknown as React.FormEvent)}
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}
