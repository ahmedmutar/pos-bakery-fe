import { CheckCircle, Printer, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../../lib/utils'
import { useThermalReceipt } from './ThermalReceipt'

interface SuccessModalProps {
  transactionId: string
  total: number
  change: number
  onNewTransaction: () => void
}

export default function SuccessModal({ transactionId, total, change, onNewTransaction }: SuccessModalProps) {
  const { t } = useTranslation()
  const { print, isReady, isLoading, isOffline } = useThermalReceipt({ transactionId, change })

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-sm text-center">
        <div className="px-6 pt-8 pb-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="font-display text-xl font-semibold text-oven-800 mb-1">
            Pembayaran Berhasil
          </h2>
          <p className="font-body text-sm text-crust-400">
            #{transactionId.slice(-8).toUpperCase()}
          </p>
        </div>

        <div className="mx-6 bg-dough-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between font-body text-sm text-crust-600">
            <span>{t('common.total')}</span>
            <span className="font-medium">{formatCurrency(total)}</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between font-body text-sm text-green-600">
              <span>{t('cashier.change')}</span>
              <span className="font-medium">{formatCurrency(change)}</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={print}
            disabled={!isReady || isOffline}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
          <button
            onClick={onNewTransaction}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Transaksi Baru
          </button>
        </div>
        {isOffline && (
          <p className="font-body text-xs text-amber-600 text-center pb-3 px-6">
            Transaksi offline — struk tersedia setelah tersinkronisasi
          </p>
        )}
        {isLoading && !isOffline && (
          <p className="font-body text-xs text-crust-400 text-center pb-3 px-6">
            Memuat data struk...
          </p>
        )}
      </div>
    </div>
  )
}
