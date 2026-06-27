import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Search, Pencil, Trash2, Star, Gift, ChevronRight, Loader2, X } from 'lucide-react'
import { customerApi, type Customer } from '../services/customerService'
import { formatCurrency, cn } from '../lib/utils'

const emptyForm = { name: '', phone: '', email: '', notes: '' }

export default function CustomersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustNote, setAdjustNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => customerApi.list({ search, page, limit: 20 }),
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['customer-detail', selectedCustomer?.id],
    queryFn: () => customerApi.loyaltyHistory(selectedCustomer!.id),
    enabled: !!selectedCustomer,
  })

  const createMutation = useMutation({
    mutationFn: customerApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); resetForm() },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string; customer?: Customer } } }
      setFormError(e.response?.data?.error ?? 'Gagal menyimpan')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof emptyForm }) => customerApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['customers'] }); resetForm() },
    onError: (err: unknown) => {
      setFormError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal memperbarui')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: customerApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  const adjustMutation = useMutation({
    mutationFn: ({ id, points, note }: { id: string; points: number; note: string }) =>
      customerApi.adjustPoints(id, points, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer-detail', selectedCustomer?.id] })
      setShowAdjust(false)
      setAdjustPoints('')
      setAdjustNote('')
    },
  })

  function resetForm() {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setFormError('')
  }

  function openEdit(c: Customer) {
    setEditId(c.id)
    setForm({ name: c.name, phone: c.phone, email: c.email ?? '', notes: c.notes ?? '' })
    setFormError('')
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) return setFormError('Nama wajib diisi')
    if (!form.phone.trim()) return setFormError('Nomor HP wajib diisi')

    if (editId) {
      updateMutation.mutate({ id: editId, data: form })
    } else {
      createMutation.mutate({ name: form.name, phone: form.phone, email: form.email || undefined, notes: form.notes || undefined })
    }
  }

  const customers = data?.customers ?? []
  const total = data?.total ?? 0

  const LOYALTY_TYPE_LABEL: Record<string, string> = { EARN: 'Diperoleh', REDEEM: 'Ditukar', ADJUST: 'Koreksi' }
  const LOYALTY_COLOR: Record<string, string> = { EARN: 'text-green-600', REDEEM: 'text-red-500', ADJUST: 'text-amber-600' }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Database Pelanggan
          </h1>
          <p className="font-body text-sm text-muted-400 mt-0.5">
            {total} pelanggan terdaftar
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Pelanggan
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari nama atau nomor HP..."
          className="input pl-9 w-full max-w-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List panel */}
        <div className="lg:col-span-2 space-y-3">
          {/* Form */}
          {showForm && (
            <div className="card p-5 border-2 border-primary-200">
              <h3 className="font-display text-base font-semibold text-dark-800 mb-4">
                {editId ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-body font-medium text-primary-700 mb-1">Nama <span className="text-red-500">*</span></label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Nama pelanggan" />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-primary-700 mb-1">No. HP/WA <span className="text-red-500">*</span></label>
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="08xxxxxxxxx" />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-primary-700 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="email@contoh.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-medium text-primary-700 mb-1">Catatan</label>
                    <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" placeholder="Catatan singkat" />
                  </div>
                </div>
                {formError && <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={resetForm} className="btn-secondary flex-1">Batal</button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                    {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customers list */}
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-muted-400 animate-spin" /></div>
          ) : customers.length === 0 ? (
            <div className="card p-12 text-center">
              <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="font-body text-sm text-muted-400">{search ? 'Tidak ada hasil pencarian' : 'Belum ada pelanggan terdaftar'}</p>
            </div>
          ) : (
            <>
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={cn(
                    'card p-4 flex items-center gap-4 cursor-pointer hover:border-primary-200 transition-all',
                    selectedCustomer?.id === c.id && 'border-primary-400 bg-primary-50/30'
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-base font-bold text-primary-700">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-dark-800 truncate">{c.name}</p>
                    <p className="font-body text-xs text-muted-400">{c.phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span className="font-body text-sm font-semibold text-dark-800">{c.totalPoints.toLocaleString('id-ID')} poin</span>
                    </div>
                    <p className="font-body text-xs text-muted-400">{formatCurrency(c.lifetimeSales)} total belanja</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(c)} className="text-muted-400 hover:text-primary-600 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm(`Hapus pelanggan ${c.name}?`)) deleteMutation.mutate(c.id) }} className="text-muted-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-300" />
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {total > 20 && (
                <div className="flex justify-center gap-2 pt-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">← Prev</button>
                  <span className="font-body text-sm text-muted-500 flex items-center px-2">
                    {page} / {Math.ceil(total / 20)}
                  </span>
                  <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40">Next →</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selectedCustomer ? (
            <>
              <div className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-base font-semibold text-dark-800">{selectedCustomer.name}</h3>
                    <p className="font-body text-xs text-muted-400">{selectedCustomer.phone}</p>
                    {selectedCustomer.email && <p className="font-body text-xs text-muted-400">{selectedCustomer.email}</p>}
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-muted-300 hover:text-muted-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="font-body text-xs text-amber-700">Poin</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-amber-600">{selectedCustomer.totalPoints.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Gift className="w-4 h-4 text-green-600" />
                      <span className="font-body text-xs text-green-700">Total Belanja</span>
                    </div>
                    <p className="font-display text-base font-bold text-green-700">{formatCurrency(selectedCustomer.lifetimeSales)}</p>
                  </div>
                </div>

                {/* Adjust points */}
                {!showAdjust ? (
                  <button
                    onClick={() => setShowAdjust(true)}
                    className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                  >
                    <Star className="w-3.5 h-3.5" />
                    Koreksi Poin Manual
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={adjustPoints}
                        onChange={e => setAdjustPoints(e.target.value)}
                        placeholder="Jumlah poin (negatif = kurangi)"
                        className="input text-sm py-2 flex-1"
                      />
                    </div>
                    <input
                      type="text"
                      value={adjustNote}
                      onChange={e => setAdjustNote(e.target.value)}
                      placeholder="Catatan koreksi"
                      className="input text-sm py-2 w-full"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setShowAdjust(false)} className="btn-secondary flex-1 text-sm py-2">Batal</button>
                      <button
                        onClick={() => adjustMutation.mutate({ id: selectedCustomer.id, points: parseInt(adjustPoints) || 0, note: adjustNote })}
                        disabled={!adjustPoints || adjustMutation.isPending}
                        className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {adjustMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Loyalty history */}
              <div className="card p-4">
                <h4 className="font-body text-sm font-semibold text-dark-800 mb-3">Riwayat Poin</h4>
                {detailLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-muted-400 animate-spin" /></div>
                ) : !detailData?.history.length ? (
                  <p className="font-body text-xs text-muted-400 text-center py-4">Belum ada riwayat poin</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {detailData.history.map(h => (
                      <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-surface-100 last:border-0">
                        <div>
                          <p className="font-body text-xs font-medium text-dark-700">{LOYALTY_TYPE_LABEL[h.type]}</p>
                          {h.note && <p className="font-body text-xs text-muted-400">{h.note}</p>}
                          <p className="font-body text-xs text-muted-300">{new Date(h.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        </div>
                        <span className={cn('font-body text-sm font-semibold', LOYALTY_COLOR[h.type])}>
                          {h.points > 0 ? '+' : ''}{h.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card p-8 text-center text-surface-300">
              <Users className="w-10 h-10 mx-auto mb-2" />
              <p className="font-body text-sm">Pilih pelanggan untuk melihat detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
