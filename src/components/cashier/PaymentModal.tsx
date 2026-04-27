import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, QrCode, ArrowLeftRight, X, Check, Loader2 } from 'lucide-react'
import { transactionApi } from '../../services/transactionService'
import { saveOfflineTransaction } from '../../lib/offlineDB'
import { useOnlineStatus } from '../../hooks/useOfflineSync'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency, cn } from '../../lib/utils'
import QRISDisplay from '../payment/QRISDisplay'
import TransferDisplay from '../payment/TransferDisplay'

interface PaymentModalProps {
  onClose: () => void
  onSuccess: (transactionId: string, change?: number, total?: number) => void
}

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'CARD'

const METHODS: { key: PaymentMethod; labelKey: string; icon: typeof Banknote }[] = [
  { key: 'CASH',     labelKey: 'cashier.cash',     icon: Banknote },
  { key: 'QRIS',     labelKey: 'cashier.qris',     icon: QrCode },
  { key: 'TRANSFER', labelKey: 'cashier.transfer', icon: ArrowLeftRight },
]

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000]

export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const { items, discount, total, subtotal, activeShiftId: storeShiftId, activeOutletId: storeOutletId, clearCart } = useCartStore()
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [paidInput, setPaidInput] = useState('')
  const [paymentStep, setPaymentStep] = useState<'select' | 'process' | 'done'>('select')
  const { t } = useTranslation()
  const isOnline = useOnlineStatus()

  // Always fetch active shift fresh — don't rely only on store
  const { data: activeShiftData } = useQuery({
    queryKey: ['active-shift'],
    queryFn: transactionApi.activeShift,
    staleTime: 0,
  })

  // Use query data if store is null (e.g. after page refresh)
  const activeShiftId = storeShiftId ?? activeShiftData?.id ?? null
  const activeOutletId = storeOutletId ?? activeShiftData?.outletId ?? null
  const qc = useQueryClient()

  const totalAmount = total()
  const paidAmount = parseInt(paidInput.replace(/\D/g, '')) || 0
  const change = method === 'CASH' ? Math.max(0, paidAmount - totalAmount) : 0
  const subtotalAmount = subtotal()
  const discountValid = discount <= subtotalAmount
  const canPay = discountValid && (method === 'CASH' ? paidAmount >= totalAmount : true)

  // Save transaction to backend (or offline queue)
  const saveTx = useMutation({
    mutationFn: async ({ paymentMethod, proof }: { paymentMethod: string; proof?: string }) => {
      const payload = {
          shiftId: activeShiftId!,
          outletId: activeOutletId!,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: i.product.price,
            notes: i.notes || undefined,
          })),
          paymentMethod: paymentMethod as 'CASH' | 'QRIS' | 'TRANSFER' | 'SPLIT',
          paidAmount: method === 'CASH' ? paidAmount : totalAmount,
          discount: discount || undefined,
          paymentProof: proof || undefined,
        }
        // Offline — save all methods locally
        if (!isOnline) {
          const offlineId = await saveOfflineTransaction(payload, totalAmount)
          return { id: offlineId, offline: true } as unknown as Awaited<ReturnType<typeof transactionApi.create>>
        }
        return transactionApi.create(payload)
      },
    onSuccess: (tx) => {
      const finalTotal = totalAmount  // capture before clearCart
      const finalChange = method === 'CASH' ? change : 0
      clearCart()
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['transactions-today'] })
      qc.invalidateQueries({ queryKey: ['transaction', tx.id] })
      onSuccess(tx.id, finalChange, finalTotal)
    },
    onError: (err: unknown) => {
      console.error('saveTx error:', err)
    },
  })

  const handleProceed = () => {
    if (!activeShiftId || !activeOutletId) {
      alert('Shift belum dibuka. Buka shift terlebih dahulu.')
      return
    }
    if (method === 'CASH') {
      saveTx.mutate({ paymentMethod: 'CASH' })
    } else if (!isOnline) {
      saveTx.mutate({ paymentMethod: method })
    } else {
      // QRIS dan CARD langsung ke step process (tampil QR/form)
      setPaymentStep('process')
    }
  }

  const handleNonCashSuccess = (proof?: string) => {
    saveTx.mutate({ paymentMethod: method, proof })
  }

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100 flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-oven-800">Pembayaran</h2>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 scrollbar-thin">
          {/* ── STEP 1: Method selection ── */}
          {paymentStep === 'select' && method !== 'TRANSFER' && (
            <div className="space-y-5">
              {/* Order summary */}
              <div className="bg-dough-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between font-body text-sm text-crust-500">
                  <span>{t('cashier.subtotal')}</span>
                  <span>{formatCurrency(subtotal())}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-body text-sm text-green-600">
                    <span>Diskon</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-display text-2xl font-bold text-oven-800 pt-1 border-t border-dough-200 tracking-tight">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Method tabs */}
              <div>
                <p className="font-body text-xs font-medium text-crust-700 mb-2">{t('cashier.paymentMethod')}</p>
                <div className="grid grid-cols-4 gap-2">
                  {METHODS.map(({ key, labelKey, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setMethod(key)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-body font-medium transition-all',
                        method === key
                          ? 'bg-crust-600 text-cream border-crust-600 shadow-warm'
                          : 'bg-dough-50 text-crust-600 border-dough-200 hover:bg-dough-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {labelKey ? t(labelKey) : 'QRIS'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {method === 'CASH' && (
                <div>
                  <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                    Uang Diterima
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-crust-400">Rp</span>
                    <input
                      type="text"
                      value={paidInput}
                      onChange={(e) => setPaidInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className="input pl-9 font-mono text-lg"
                      autoFocus
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <button
                      onClick={() => setPaidInput(String(totalAmount))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all',
                        paidAmount === totalAmount
                          ? 'bg-crust-600 text-cream border-crust-600'
                          : 'bg-dough-50 text-crust-600 border-dough-200 hover:bg-dough-100'
                      )}
                    >
                      Pas
                    </button>
                    {QUICK_AMOUNTS.filter((a) => a >= totalAmount).slice(0, 3).map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setPaidInput(String(amt))}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all',
                          paidAmount === amt
                            ? 'bg-crust-600 text-cream border-crust-600'
                            : 'bg-dough-50 text-crust-600 border-dough-200 hover:bg-dough-100'
                        )}
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Change */}
                  {paidAmount >= totalAmount && (
                    <div className="mt-3 flex justify-between items-center bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
                      <span className="font-body text-sm text-green-700">{t('cashier.change')}</span>
                      <span className="font-display text-lg font-semibold text-green-700">
                        {formatCurrency(change)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Non-cash info */}
              {method !== 'CASH' && (method as string) !== 'TRANSFER' && (
                <div className="bg-dough-50 border border-dough-200 rounded-xl px-4 py-3 text-center">
                  <p className="font-body text-sm text-crust-500">
                    {method === 'QRIS' && 'QR code akan tampil untuk di-scan pelanggan'}
                    {method === 'CARD' && 'Form pembayaran kartu kredit/debit akan ditampilkan'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TRANSFER — shown at select step ── */}
          {paymentStep === 'select' && (method as string) === 'TRANSFER' && (
            <TransferDisplay
              amount={totalAmount}
              onConfirm={(proof) => {
                if (!activeShiftId || !activeOutletId) {
                  alert('Shift belum dibuka. Buka shift terlebih dahulu.')
                  return
                }
                saveTx.mutate({ paymentMethod: 'TRANSFER', proof })
              }}
            />
          )}

          {/* ── STEP 2: Payment processing ── */}
          {paymentStep === 'process' && (
            <div>
              {method === 'QRIS' && (
                <QRISDisplay
                  amount={totalAmount}
                  onConfirm={handleNonCashSuccess}
                />
              )}
              {method === 'TRANSFER' && (
                <TransferDisplay
                  amount={totalAmount}
                  onConfirm={handleNonCashSuccess}
                />
              )}

            </div>
          )}
        </div>

        {/* Footer — only show on select step */}
        {paymentStep === 'select' && method !== 'TRANSFER' && (
          <div className="px-6 pb-5 pt-3 border-t border-dough-100 flex gap-3 flex-shrink-0">
            <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button
              onClick={handleProceed}
              disabled={!canPay || saveTx.isPending}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'bg-crust-600 hover:bg-crust-700 text-cream font-body font-medium',
                'px-5 py-2.5 rounded-xl transition-all shadow-warm',
                (!canPay || saveTx.isPending) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {(saveTx.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : method === 'CASH' ? (
                <><Check className="w-4 h-4" /> Bayar</>
              ) : (
                <><QrCode className="w-4 h-4" /> Lanjut</>
              )}
            </button>
          </div>
        )}

        {/* Back button on process step */}
        {paymentStep === 'process' && (
          <div className="px-6 pb-5 pt-3 border-t border-dough-100 flex-shrink-0">
            <button
              onClick={() => setPaymentStep('select')}
              className="btn-secondary w-full text-sm"
            >
              ← Ganti metode pembayaran
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
