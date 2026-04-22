import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Banknote, X } from 'lucide-react'
import { transactionApi } from '../../services/transactionService'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency, cn } from '../../lib/utils'
import ShiftConflictModal from './ShiftConflictModal'

interface OpenShiftModalProps {
  outletId: string
  onClose: () => void
}

interface ConflictData {
  id: string
  openedAt: string
  outletName: string
}

const QUICK_AMOUNTS = [100_000, 200_000, 500_000, 1_000_000]

export default function OpenShiftModal({ outletId, onClose }: OpenShiftModalProps) {
  const [openingCash, setOpeningCash] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [conflict, setConflict] = useState<ConflictData | null>(null)
  const setActiveShift = useCartStore((s) => s.setActiveShift)
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (forceClose?: boolean) =>
      transactionApi.openShift(outletId, openingCash, forceClose),
    onSuccess: (shift) => {
      setActiveShift(shift.id, outletId)
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
        pendingOpen={{ outletId, openingCash }}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-crust-600" />
            <h2 className="font-display text-lg font-semibold text-oven-800">{t('cashier.openShift')}</h2>
          </div>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="font-body text-sm text-crust-500">
            Masukkan jumlah uang tunai di laci kasir saat ini.
          </p>

          <div>
            <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
              Kas Awal
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-crust-400">
                Rp
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="0"
                className="input pl-9 font-mono text-lg"
                autoFocus
              />
            </div>
            {openingCash > 0 && (
              <p className="font-body text-xs text-crust-400 mt-1">
                {formatCurrency(openingCash)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setOpeningCash(amt)
                  setInputValue(String(amt))
                }}
                className={cn(
                  'py-2 px-3 rounded-xl text-sm font-body font-medium border transition-all',
                  openingCash === amt
                    ? 'bg-crust-600 text-cream border-crust-600'
                    : 'bg-dough-50 text-crust-600 border-dough-200 hover:bg-dough-100'
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

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Batal
          </button>
          <button
            onClick={() => mutate(undefined)}
            disabled={isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" />
            )}
            Buka Shift
          </button>
        </div>
      </div>
    </div>
  )
}
