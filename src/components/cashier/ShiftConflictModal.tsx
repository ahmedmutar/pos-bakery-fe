import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, X, Loader2, LogOut, RefreshCw } from 'lucide-react'
import { transactionApi } from '../../services/transactionService'
import { useCartStore } from '../../stores/cartStore'

interface ExistingShift {
  id: string
  openedAt: string
  outletName: string
}

interface ShiftConflictModalProps {
  existingShift: ExistingShift
  pendingOpen: { outletId: string; openingCash: number }
  onClose: () => void
}

export default function ShiftConflictModal({
  existingShift,
  pendingOpen,
  onClose,
}: ShiftConflictModalProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const setActiveShift = useCartStore((s) => s.setActiveShift)
  const [step, setStep] = useState<'choose' | 'closing'>('choose')

  const openedAt = new Date(existingShift.openedAt)
  const hoursAgo = Math.round((Date.now() - openedAt.getTime()) / (1000 * 60 * 60))
  const minsAgo = Math.round((Date.now() - openedAt.getTime()) / (1000 * 60))

  // Close old shift then open new one
  const forceCloseThenOpen = useMutation({
    mutationFn: async () => {
      setStep('closing')
      await transactionApi.forceCloseShift(existingShift.id)
      return transactionApi.openShift(pendingOpen.outletId, pendingOpen.openingCash)
    },
    onSuccess: (shift) => {
      setActiveShift(shift.id, shift.outletId)
      qc.invalidateQueries({ queryKey: ['active-shift'] })
      onClose()
    },
  })

  // Resume existing shift instead
  const resumeShift = () => {
    setActiveShift(existingShift.id, pendingOpen.outletId)
    qc.invalidateQueries({ queryKey: ['active-shift'] })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-display text-base font-semibold text-oven-800">
              Shift Sebelumnya Masih Terbuka
            </h2>
          </div>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
            <p className="font-body text-sm font-medium text-amber-800">
              Ada shift yang belum ditutup
            </p>
            <p className="font-body text-xs text-amber-600">
              Outlet: {existingShift.outletName}
            </p>
            <p className="font-body text-xs text-amber-600">
              Dibuka:{' '}
              {openedAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
              {openedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {hoursAgo > 0 ? `${hoursAgo} jam` : `${minsAgo} menit`} yang lalu
            </p>
          </div>

          <p className="font-body text-sm text-crust-600">
            Pilih tindakan:
          </p>

          {/* Option 1: Resume */}
          <button
            onClick={resumeShift}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-dough-200
                       hover:border-crust-300 hover:bg-dough-50 transition-all text-left"
          >
            <RefreshCw className="w-5 h-5 text-crust-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-oven-800">
                Lanjutkan shift sebelumnya
              </p>
              <p className="font-body text-xs text-crust-400 mt-0.5">
                Gunakan shift yang sudah terbuka. Cocok jika Anda kasir yang sama dan lupa menutup shift.
              </p>
            </div>
          </button>

          {/* Option 2: Force close + new */}
          <button
            onClick={() => forceCloseThenOpen.mutate()}
            disabled={forceCloseThenOpen.isPending}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-red-100
                       hover:border-red-300 hover:bg-red-50 transition-all text-left
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {forceCloseThenOpen.isPending ? (
              <Loader2 className="w-5 h-5 text-red-400 animate-spin flex-shrink-0 mt-0.5" />
            ) : (
              <LogOut className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-body text-sm font-semibold text-red-700">
                {step === 'closing' ? 'Menutup shift lama...' : t('shift.forceClose')}
              </p>
              <p className="font-body text-xs text-red-400 mt-0.5">
                Shift sebelumnya ditutup otomatis dengan kas akhir = kas awal + total penjualan.
              </p>
            </div>
          </button>

          {forceCloseThenOpen.isError && (
            <p className="text-red-500 text-xs font-body bg-red-50 px-3 py-2 rounded-xl">
              Gagal menutup shift. Coba lagi.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
