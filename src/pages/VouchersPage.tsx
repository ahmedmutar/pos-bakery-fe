import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Ticket, ToggleLeft, ToggleRight, CalendarDays, Hash } from 'lucide-react'
import { voucherApi, type VoucherCode, type CreateVoucherPayload } from '../services/voucherService'
import { formatCurrency, cn } from '../lib/utils'

const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  FLAT: 'Nominal (Rp)',
  PERCENT: 'Persentase (%)',
}

const emptyForm: CreateVoucherPayload = {
  code: '',
  description: '',
  discountType: 'FLAT',
  discountValue: 0,
  minOrderValue: 0,
  maxUsage: null,
  expiresAt: null,
  isActive: true,
}

export default function VouchersPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateVoucherPayload>(emptyForm)
  const [formError, setFormError] = useState('')

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: voucherApi.list,
  })

  const createMutation = useMutation({
    mutationFn: voucherApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vouchers'] }); resetForm() },
    onError: (err: unknown) => {
      setFormError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal menyimpan voucher')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVoucherPayload> }) => voucherApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vouchers'] }); resetForm() },
    onError: (err: unknown) => {
      setFormError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal memperbarui voucher')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: voucherApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => voucherApi.update(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vouchers'] }),
  })

  function resetForm() {
    setShowForm(false)
    setEditId(null)
    setForm(emptyForm)
    setFormError('')
  }

  function openEdit(v: VoucherCode) {
    setEditId(v.id)
    setForm({
      code: v.code,
      description: v.description ?? '',
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrderValue: v.minOrderValue,
      maxUsage: v.maxUsage,
      expiresAt: v.expiresAt ? v.expiresAt.slice(0, 10) : null,
      isActive: v.isActive,
    })
    setFormError('')
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.code) return setFormError('Kode voucher wajib diisi')
    if (form.discountValue <= 0) return setFormError('Nilai diskon harus lebih dari 0')
    if (form.discountType === 'PERCENT' && form.discountValue > 100) return setFormError('Diskon persentase maksimal 100%')

    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minOrderValue: Number(form.minOrderValue ?? 0),
      maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
      expiresAt: form.expiresAt || null,
    }

    if (editId) {
      updateMutation.mutate({ id: editId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isExpired = (v: VoucherCode) => v.expiresAt ? new Date() > new Date(v.expiresAt) : false
  const isMaxed = (v: VoucherCode) => v.maxUsage !== null && v.usageCount >= v.maxUsage

  const activeCount = vouchers.filter(v => v.isActive && !isExpired(v) && !isMaxed(v)).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark-800 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary-600" />
            Voucher & Promo
          </h1>
          <p className="font-body text-sm text-muted-400 mt-0.5">
            Kelola kode diskon untuk pelanggan
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Buat Voucher
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="font-body text-xs text-muted-400 mb-1">Total Voucher</p>
          <p className="font-display text-2xl font-bold text-dark-800">{vouchers.length}</p>
        </div>
        <div className="card p-4">
          <p className="font-body text-xs text-muted-400 mb-1">Aktif</p>
          <p className="font-display text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="card p-4">
          <p className="font-body text-xs text-muted-400 mb-1">Total Pemakaian</p>
          <p className="font-display text-2xl font-bold text-primary-600">
            {vouchers.reduce((s, v) => s + v.usageCount, 0)}x
          </p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5 border-2 border-primary-200">
          <h3 className="font-display text-base font-semibold text-dark-800 mb-4">
            {editId ? 'Edit Voucher' : 'Buat Voucher Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1">
                  Kode Voucher <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="cth: DISKON10"
                  className="input font-mono tracking-wider"
                  disabled={!!editId}
                />
                {editId && <p className="font-body text-xs text-muted-400 mt-1">Kode tidak dapat diubah</p>}
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1">Deskripsi</label>
                <input
                  type="text"
                  value={form.description ?? ''}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="cth: Diskon spesial akhir tahun"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1">
                  Tipe Diskon <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm(f => ({ ...f, discountType: e.target.value as 'FLAT' | 'PERCENT' }))}
                  className="input"
                >
                  {Object.entries(DISCOUNT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1">
                  Nilai Diskon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">
                    {form.discountType === 'FLAT' ? 'Rp' : '%'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={form.discountType === 'PERCENT' ? 100 : undefined}
                    value={form.discountValue || ''}
                    onChange={(e) => setForm(f => ({ ...f, discountValue: parseInt(e.target.value) || 0 }))}
                    className="input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1">
                  Min. Transaksi (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">Rp</span>
                  <input
                    type="number"
                    min={0}
                    value={form.minOrderValue || ''}
                    onChange={(e) => setForm(f => ({ ...f, minOrderValue: parseInt(e.target.value) || 0 }))}
                    placeholder="0 = tidak ada minimum"
                    className="input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1">
                  Maks. Pemakaian
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxUsage ?? ''}
                  onChange={(e) => setForm(f => ({ ...f, maxUsage: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="kosong = tidak terbatas"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1">
                  Berlaku Hingga
                </label>
                <input
                  type="date"
                  value={form.expiresAt ?? ''}
                  onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value || null }))}
                  className="input"
                />
              </div>

              <div className="flex items-center gap-3 pt-5">
                <span className="font-body text-sm text-dark-800">Status Aktif</span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={cn('transition-colors', form.isActive ? 'text-primary-600' : 'text-muted-300')}
                >
                  {form.isActive
                    ? <ToggleRight className="w-8 h-8" />
                    : <ToggleLeft className="w-8 h-8" />
                  }
                </button>
              </div>
            </div>

            {formError && (
              <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={resetForm} className="btn-secondary flex-1">Batal</button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : editId ? 'Simpan Perubahan' : 'Buat Voucher'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="card p-12 text-center">
          <Ticket className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="font-body text-sm text-muted-400">Belum ada voucher. Buat voucher pertama Anda!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map((v) => {
            const expired = isExpired(v)
            const maxed = isMaxed(v)
            const inactive = !v.isActive || expired || maxed

            return (
              <div
                key={v.id}
                className={cn(
                  'card p-4 flex items-start gap-4',
                  inactive && 'opacity-60'
                )}
              >
                {/* Code badge */}
                <div className={cn(
                  'flex-shrink-0 px-3 py-2 rounded-xl font-mono text-base font-bold tracking-wider',
                  inactive
                    ? 'bg-surface-100 text-muted-400'
                    : 'bg-primary-600 text-white'
                )}>
                  {v.code}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      'font-body text-base font-semibold',
                      inactive ? 'text-muted-400' : 'text-dark-800'
                    )}>
                      {v.discountType === 'FLAT'
                        ? `- ${formatCurrency(v.discountValue)}`
                        : `- ${v.discountValue}%`
                      }
                    </span>
                    {/* Status badges */}
                    {expired && (
                      <span className="bg-red-100 text-red-600 text-xs font-body font-medium px-2 py-0.5 rounded-full">
                        Kadaluarsa
                      </span>
                    )}
                    {maxed && !expired && (
                      <span className="bg-amber-100 text-amber-600 text-xs font-body font-medium px-2 py-0.5 rounded-full">
                        Habis
                      </span>
                    )}
                    {!v.isActive && !expired && !maxed && (
                      <span className="bg-surface-200 text-muted-400 text-xs font-body font-medium px-2 py-0.5 rounded-full">
                        Nonaktif
                      </span>
                    )}
                    {v.isActive && !expired && !maxed && (
                      <span className="bg-green-100 text-green-600 text-xs font-body font-medium px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  {v.description && (
                    <p className="font-body text-xs text-muted-400 mt-0.5">{v.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {v.minOrderValue > 0 && (
                      <span className="font-body text-xs text-muted-400 flex items-center gap-1">
                        Min. {formatCurrency(v.minOrderValue)}
                      </span>
                    )}
                    {v.maxUsage !== null && (
                      <span className="font-body text-xs text-muted-400 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {v.usageCount}/{v.maxUsage}x
                      </span>
                    )}
                    {v.maxUsage === null && v.usageCount > 0 && (
                      <span className="font-body text-xs text-muted-400 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {v.usageCount}x dipakai
                      </span>
                    )}
                    {v.expiresAt && (
                      <span className="font-body text-xs text-muted-400 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {new Date(v.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleMutation.mutate({ id: v.id, isActive: !v.isActive })}
                    className={cn('transition-colors', v.isActive ? 'text-primary-600 hover:text-primary-800' : 'text-muted-300 hover:text-primary-600')}
                    title={v.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {v.isActive
                      ? <ToggleRight className="w-6 h-6" />
                      : <ToggleLeft className="w-6 h-6" />
                    }
                  </button>
                  <button
                    onClick={() => openEdit(v)}
                    className="text-muted-400 hover:text-primary-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus voucher ${v.code}?`)) deleteMutation.mutate(v.id)
                    }}
                    className="text-muted-400 hover:text-red-500 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
