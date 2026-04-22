import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, LogOut } from 'lucide-react'
import { transactionApi } from '../../services/transactionService'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency, cn } from '../../lib/utils'

interface CloseShiftModalProps {
  shiftId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CloseShiftModal({ shiftId, onClose, onSuccess }: CloseShiftModalProps) {
  const { t } = useTranslation()
    const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')
  const clearShift = useCartStore((s) => s.clearShift)
  const clearCart = useCartStore((s) => s.clearCart)
  const qc = useQueryClient()

  const amount = parseInt(closingCash.replace(/\D/g, '')) || 0

  const { mutate, isPending } = useMutation({
    mutationFn: () => transactionApi.closeShift(shiftId, amount, notes || undefined),
    onSuccess: () => {
      clearShift()
      clearCart()
      qc.invalidateQueries({ queryKey: ['active-shift'] })
      onSuccess()
    },
  })

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100">
          <div className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-500" />
            <h2 className="font-display text-lg font-semibold text-oven-800">{t('cashier.closeShift')}</h2>
          </div>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="font-body text-sm text-crust-500">
            Hitung uang tunai di laci kasir sekarang dan masukkan jumlahnya.
          </p>

          <div>
            <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
              Kas Akhir
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-crust-400">Rp</span>
              <input
                type="text"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="input pl-9 font-mono text-lg"
                autoFocus
              />
            </div>
            {amount > 0 && (
              <p className="font-body text-xs text-crust-400 mt-1">{formatCurrency(amount)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan shift..."
              className="input resize-none h-20 text-sm"
            />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button
            onClick={() => mutate()}
            disabled={isPending || amount === 0}
            className={cn(
              'flex-1 flex items-center justify-center gap-2',
              'bg-red-500 hover:bg-red-600 text-white font-body font-medium',
              'px-5 py-2.5 rounded-xl transition-all',
              (isPending || amount === 0) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Tutup Shift
          </button>
        </div>
      </div>
    </div>
  )
}
