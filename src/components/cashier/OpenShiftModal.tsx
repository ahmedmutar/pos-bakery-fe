import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, X, Store } from 'lucide-react'
import { transactionApi } from '../../services/transactionService'
import { outletApi } from '../../services/outletService'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency, cn } from '../../lib/utils'
import ShiftConflictModal from './ShiftConflictModal'

interface OpenShiftModalProps {
  outletId?: string  // optional — kalau tidak dikirim, user pilih sendiri
  onClose: () => void
}

interface ConflictData {
  id: string
  openedAt: string
  outletName: string
}

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000]

export default function OpenShiftModal({ outletId: defaultOutletId, onClose }: OpenShiftModalProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const setActiveShift = useCartStore((s) => s.setActiveShift)

  const [selectedOutletId, setSelectedOutletId] = useState(defaultOutletId ?? '')
  const [openingCash, setOpeningCash] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [conflict, setConflict] = useState<ConflictData | null>(null)

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: outletApi.list,
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: (forceClose?: boolean) =>
      transactionApi.openShift(selectedOutletId, openingCash, forceClose),
    onSuccess: (shift) => {
      setActiveShift(shift.id, selectedOutletId)
      qc.invalidateQueries({ queryKey: ['active-shift'] })
      onClose()
    },
    onError: (err: { response?: { data?: { code?: string; error?: string; existingShift?: ConflictData } } }) => {
      const data = err.response?.data
      if (data?.code === 'SHIFT_CONFLICT' && data.existingShift) {
        setConflict(data.existingShift)
      }
    },
  })

  const handleInput = (val: string) => {
    const num = parseInt(val.replace(/\D/g, '')) || 0
    setInputValue(val.replace(/\D/g, ''))
    setOpeningCash(num)
  }

  if (conflict) {
    return (
      <ShiftConflictModal
        existingShift={conflict}
        pendingOpen={{ outletId: selectedOutletId, openingCash }}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary-600" />
            <h2 className="font-display text-lg font-semibold text-dark-800">{t('cashier.openShift')}</h2>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Outlet selector — tampil kalau lebih dari 1 outlet */}
          {outlets.length > 1 && (
            <div>
              <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
                <Store className="inline w-3.5 h-3.5 mr-1" />
                Pilih Outlet
              </label>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="input"
              >
                <option value="">-- Pilih outlet --</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Kas awal */}
          <div>
            <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
              {t('shift.openingCash')}
            </label>
            <p className="font-body text-xs text-muted-400 mb-2">
              Masukkan jumlah uang tunai di laci kasir saat ini.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">
                Rp
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="0"
                className="input pl-9 font-mono text-lg"
                autoFocus={outlets.length <= 1}
              />
            </div>
            {openingCash > 0 && (
              <p className="font-body text-xs text-muted-400 mt-1">
                {formatCurrency(openingCash)}
              </p>
            )}
          </div>

          {/* Quick amounts */}
          <div className="grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => { setOpeningCash(amt); setInputValue(String(amt)) }}
                className={cn(
                  'py-2 px-3 rounded-xl text-sm font-body font-medium border transition-all',
                  openingCash === amt
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-surface-50 text-primary-600 border-surface-200 hover:bg-surface-100'
                )}
              >
                {formatCurrency(amt)}
              </button>
            ))}
          </div>

          {error && !conflict && (
            <p className="text-red-600 text-sm font-body bg-red-50 px-3 py-2 rounded-xl">
              {(error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Gagal membuka shift. Coba lagi.'}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutate(undefined)}
            disabled={isPending || !selectedOutletId}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {t('cashier.openShift')}
          </button>
        </div>
      </div>
    </div>
  )
}
