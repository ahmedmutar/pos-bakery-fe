import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Loader2, AlertCircle, History } from 'lucide-react'
import { transactionApi } from '../services/transactionService'
import { outletApi } from '../services/outletService'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { useCashierShortcuts } from '../hooks/useCashierShortcuts'
import ProductGrid from '../components/cashier/ProductGrid'
import CartPanel from '../components/cashier/CartPanel'
import OpenShiftModal from '../components/cashier/OpenShiftModal'
import CloseShiftModal from '../components/cashier/CloseShiftModal'
import OfflineStatusBar from '../components/cashier/OfflineStatusBar'
import TransactionHistoryPanel from '../components/cashier/TransactionHistoryPanel'
import ShortcutHint from '../components/cashier/ShortcutHint'

export default function CashierPage() {
  const user = useAuthStore((s) => s.user)
  const { activeShiftId, setActiveShift, items, clearCart } = useCartStore()
  const [showOpenShift, setShowOpenShift] = useState(false)
  const [showCloseShift, setShowCloseShift] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [triggerPay, setTriggerPay] = useState(0)
  const [triggerDiscount, setTriggerDiscount] = useState(0)
  const [triggerSearch, setTriggerSearch] = useState(0)
  const [triggerNumeric, setTriggerNumeric] = useState<number | null>(null)

  const { data: outlets = [] } = useQuery({
    queryKey: ['outlets'],
    queryFn: outletApi.list,
  })
  const defaultOutletId = outlets[0]?.id ?? ''

  const { data: activeShiftData, isLoading: checkingShift } = useQuery({
    queryKey: ['active-shift'],
    queryFn: transactionApi.activeShift,
    refetchOnMount: true,
    staleTime: 0,
  })

  useEffect(() => {
    if (activeShiftData && !activeShiftId) {
      setActiveShift(activeShiftData.id, activeShiftData.outletId)
    }
  }, [activeShiftData, activeShiftId, setActiveShift])

  const { t } = useTranslation()
  const hasShift = !!activeShiftId

  // Keyboard shortcuts
  useCashierShortcuts({
    onSearch: () => setTriggerSearch((n) => n + 1),
    onPay: () => { if (items.length > 0) setTriggerPay((n) => n + 1) },
    onDiscount: () => setTriggerDiscount((n) => n + 1),
    onClearCart: () => { if (items.length > 0) clearCart() },
    onHistory: () => { if (hasShift) setShowHistory((v) => !v) },
    onOpenShift: () => {
      if (!hasShift) setShowOpenShift(true)
      else setShowCloseShift(true)
    },
    onNumeric: (n) => setTriggerNumeric(n),
  }, !showOpenShift && !showCloseShift && !showHistory)

  if (checkingShift) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 lg:-m-6">
      {/* Shift status bar */}
      <div className="bg-white border-b border-dough-200 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {hasShift ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-body text-sm text-oven-700">
                {t('cashier.shiftActive')} · {user?.name}
              </span>
              {outlets[0] && (
                <span className="font-body text-xs text-crust-400">· {outlets[0].name}</span>
              )}
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="font-body text-sm text-crust-500">Belum ada shift aktif</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <ShortcutHint />

          {hasShift && (
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 text-sm font-body font-medium text-crust-600
                         hover:bg-dough-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              Riwayat
            </button>
          )}

          {!hasShift ? (
            <button
              onClick={() => setShowOpenShift(true)}
              disabled={false}
              className="btn-primary text-sm py-1.5 px-4 disabled:opacity-50"
            >
              Buka Shift
            </button>
          ) : (
            <button
              onClick={() => setShowCloseShift(true)}
              className="flex items-center gap-1.5 text-sm font-body font-medium text-red-500
                         hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Tutup Shift
            </button>
          )}
        </div>
      </div>

      {/* No shift warning */}
      {!hasShift && (
        <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="font-body text-sm text-amber-700">
            {t('cashier.openShiftFirst')}
          </p>
          <button
            onClick={() => setShowOpenShift(true)}
            className="ml-auto text-sm font-body font-medium text-amber-700 underline whitespace-nowrap"
          >
            Buka sekarang
          </button>
        </div>
      )}

      <OfflineStatusBar />

      {/* Main area */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden min-h-0">
          <ProductGrid
            triggerSearch={triggerSearch}
            triggerNumeric={triggerNumeric}
            onNumericHandled={() => setTriggerNumeric(null)}
          />
        </div>
        <div className="w-full lg:w-80 flex-shrink-0 overflow-hidden border-t lg:border-t-0 lg:border-l border-dough-200 max-h-[45vh] lg:max-h-none">
          <CartPanel
            triggerPay={triggerPay}
            triggerDiscount={triggerDiscount}
          />
        </div>
      </div>

      {showOpenShift && (
        <OpenShiftModal outletId={defaultOutletId || undefined} onClose={() => setShowOpenShift(false)} />
      )}
      {showCloseShift && activeShiftId && (
        <CloseShiftModal
          shiftId={activeShiftId}
          onClose={() => setShowCloseShift(false)}
          onSuccess={() => setShowCloseShift(false)}
        />
      )}
      {showHistory && (
        <TransactionHistoryPanel onClose={() => setShowHistory(false)} />
      )}
    </div>
  )
}
