import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Banknote, QrCode, ArrowLeftRight, X, Check, Loader2, Phone, User, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { transactionApi } from '../../services/transactionService'
import { customerApi, type Customer } from '../../services/customerService'
import { saveOfflineTransaction } from '../../lib/offlineDB'
import { useOnlineStatus } from '../../hooks/useOfflineSync'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency, cn } from '../../lib/utils'
import QRISDisplay from '../payment/QRISDisplay'
import TransferDisplay from '../payment/TransferDisplay'
import api from '../../lib/api'

interface PaymentModalProps {
  onClose: () => void
  onSuccess: (transactionId: string, change?: number, total?: number, waReceiptSent?: boolean, pointsEarned?: number) => void
}

type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'CARD'

const METHODS: { key: PaymentMethod; labelKey: string; icon: typeof Banknote }[] = [
  { key: 'CASH',     labelKey: 'cashier.cash',     icon: Banknote },
  { key: 'QRIS',     labelKey: 'cashier.qris',     icon: QrCode },
  { key: 'TRANSFER', labelKey: 'cashier.transfer', icon: ArrowLeftRight },
]

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000]

interface LoyaltySettings { loyaltyEnabled: boolean; pointsPerRupiah: number; pointsRedeemValue: number }

export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const { items, discount, voucher, total, subtotal, activeShiftId: storeShiftId, activeOutletId: storeOutletId, clearCart } = useCartStore()
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [paidInput, setPaidInput] = useState('')
  const [paymentStep, setPaymentStep] = useState<'select' | 'process' | 'done'>('select')

  // Customer + loyalty state (local — not stored in cartStore to avoid cleanup issues)
  const [customerPhone, setCustomerPhone] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [showLoyalty, setShowLoyalty] = useState(false)
  const [redeemInput, setRedeemInput] = useState('')
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { t } = useTranslation()
  const isOnline = useOnlineStatus()

  // Fetch loyalty settings
  const { data: loyaltySettings } = useQuery<LoyaltySettings>({
    queryKey: ['loyalty-settings'],
    queryFn: async () => (await api.get('/settings/loyalty')).data,
    enabled: isOnline,
  })

  // Always fetch active shift fresh
  const { data: activeShiftData } = useQuery({
    queryKey: ['active-shift'],
    queryFn: transactionApi.activeShift,
    staleTime: 0,
  })

  const activeShiftId = storeShiftId ?? activeShiftData?.id ?? null
  const activeOutletId = storeOutletId ?? activeShiftData?.outletId ?? null
  const qc = useQueryClient()

  // Computed loyalty discount
  const redeemPoints = parseInt(redeemInput) || 0
  const maxRedeemPoints = foundCustomer?.totalPoints ?? 0
  const validRedeemPoints = Math.min(redeemPoints, maxRedeemPoints)
  const loyaltyDiscount = loyaltySettings ? validRedeemPoints * loyaltySettings.pointsRedeemValue : 0

  const baseTotal = total()             // subtotal - voucher/manual discount
  const finalTotal = Math.max(0, baseTotal - loyaltyDiscount)
  const paidAmount = parseInt(paidInput.replace(/\D/g, '')) || 0
  const change = method === 'CASH' ? Math.max(0, paidAmount - finalTotal) : 0
  const subtotalAmount = subtotal()
  const discountValid = discount <= subtotalAmount
  const canPay = discountValid && (method === 'CASH' ? paidAmount >= finalTotal : true)

  // Customer phone lookup (debounced)
  function handlePhoneChange(val: string) {
    setCustomerPhone(val)
    setFoundCustomer(null)
    setLookupError('')
    setRedeemInput('')
    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current)
    const cleaned = val.trim().replace(/\s/g, '')
    if (cleaned.length >= 9 && isOnline) {
      phoneDebounceRef.current = setTimeout(async () => {
        setLookupLoading(true)
        try {
          const customer = await customerApi.lookup(cleaned)
          if (customer) setFoundCustomer(customer)
          else setLookupError('Pelanggan tidak ditemukan')
        } catch {
          setLookupError('')
        } finally {
          setLookupLoading(false)
        }
      }, 600)
    }
  }

  // Save transaction
  const saveTx = useMutation({
    mutationFn: async ({ paymentMethod, proof }: { paymentMethod: string; proof?: string }) => {
      const phone = customerPhone.trim().replace(/\s/g, '') || undefined
      const payload = {
        shiftId: activeShiftId!,
        outletId: activeOutletId!,
        items: items.map((i) => ({
          productId: i.product.id,
          variantId: i.variantId || undefined,
          quantity: i.quantity,
          unitPrice: i.variantPrice ?? i.product.price,
          notes: i.notes || undefined,
        })),
        paymentMethod: paymentMethod as 'CASH' | 'QRIS' | 'TRANSFER' | 'SPLIT',
        paidAmount: method === 'CASH' ? paidAmount : finalTotal,
        discount: (discount + loyaltyDiscount) || undefined,
        voucherCode: voucher?.code || undefined,
        customerPhone: phone,
        customerId: foundCustomer?.id || undefined,
        redeemPoints: validRedeemPoints || undefined,
        paymentProof: proof || undefined,
      }
      if (!isOnline) {
        const offlineId = await saveOfflineTransaction(payload, finalTotal)
        return { id: offlineId, offline: true, pointsEarned: 0, pointsRedeemed: 0 } as unknown as Awaited<ReturnType<typeof transactionApi.create>>
      }
      return transactionApi.create(payload)
    },
    onSuccess: (tx) => {
      const finalChange = method === 'CASH' ? change : 0
      const waReceiptSent = !!(customerPhone.trim())
      const pointsEarned = tx.pointsEarned ?? 0
      clearCart()
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['transactions-today'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      onSuccess(tx.id, finalChange, finalTotal, waReceiptSent, pointsEarned)
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
      setPaymentStep('process')
    }
  }

  const handleNonCashSuccess = (proof?: string) => {
    saveTx.mutate({ paymentMethod: method, proof })
  }

  const loyaltyEnabled = loyaltySettings?.loyaltyEnabled && isOnline

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-md max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 flex-shrink-0">
          <h2 className="font-display text-lg font-semibold text-dark-800">Pembayaran</h2>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 scrollbar-thin space-y-5">
          {/* ── STEP 1: Method selection ── */}
          {paymentStep === 'select' && method !== 'TRANSFER' && (
            <>
              {/* Order summary */}
              <div className="bg-surface-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between font-body text-sm text-muted-500">
                  <span>{t('cashier.subtotal')}</span>
                  <span>{formatCurrency(subtotalAmount)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between font-body text-sm text-green-600">
                    <span>{voucher ? `Voucher (${voucher.code})` : 'Diskon'}</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between font-body text-sm text-amber-600">
                    <span>Tukar Poin ({validRedeemPoints} poin)</span>
                    <span>- {formatCurrency(loyaltyDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-display text-2xl font-bold text-dark-800 pt-1 border-t border-surface-200 tracking-tight">
                  <span>Total</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
              </div>

              {/* Customer phone + lookup */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-body font-medium text-primary-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  No. WhatsApp Pelanggan
                  <span className="text-muted-400 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="contoh: 08123456789"
                    className="input text-sm py-2 w-full pr-8"
                  />
                  {lookupLoading && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400 animate-spin" />
                  )}
                </div>

                {/* Customer found */}
                {foundCustomer && (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-semibold text-amber-800 truncate">{foundCustomer.name}</p>
                        <p className="font-body text-xs text-amber-600 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {foundCustomer.totalPoints.toLocaleString('id')} poin tersedia
                        </p>
                      </div>
                      {loyaltyEnabled && foundCustomer.totalPoints > 0 && (
                        <button
                          onClick={() => setShowLoyalty(!showLoyalty)}
                          className="text-xs font-body font-medium text-amber-700 flex items-center gap-1 hover:text-amber-900"
                        >
                          Tukar {showLoyalty ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Redeem points input */}
                    {showLoyalty && loyaltyEnabled && (
                      <div className="pt-1 border-t border-amber-200">
                        <label className="block text-xs font-body text-amber-700 mb-1.5">
                          Tukar poin jadi diskon
                          {loyaltySettings && (
                            <span className="text-amber-500 ml-1">
                              (1 poin = {formatCurrency(loyaltySettings.pointsRedeemValue)})
                            </span>
                          )}
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min={0}
                            max={foundCustomer.totalPoints}
                            value={redeemInput}
                            onChange={(e) => setRedeemInput(e.target.value)}
                            className="input text-sm py-1.5 flex-1"
                            placeholder="0"
                          />
                          <button
                            onClick={() => setRedeemInput(String(foundCustomer.totalPoints))}
                            className="text-xs font-body text-amber-700 hover:text-amber-900 whitespace-nowrap"
                          >
                            Semua
                          </button>
                        </div>
                        {loyaltyDiscount > 0 && (
                          <p className="font-body text-xs text-green-700 mt-1">
                            Diskon: {formatCurrency(loyaltyDiscount)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {lookupError && !foundCustomer && customerPhone.length >= 9 && (
                  <p className="font-body text-xs text-muted-400 mt-1">{lookupError}</p>
                )}
              </div>

              {/* Method tabs */}
              <div>
                <p className="font-body text-xs font-medium text-primary-700 mb-2">{t('cashier.paymentMethod')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map(({ key, labelKey, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setMethod(key)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-body font-medium transition-all',
                        method === key
                          ? 'bg-primary-600 text-white border-primary-600 shadow-warm'
                          : 'bg-surface-50 text-primary-600 border-surface-200 hover:bg-surface-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {t(labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {method === 'CASH' && (
                <div>
                  <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
                    Uang Diterima
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">Rp</span>
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
                      onClick={() => setPaidInput(String(finalTotal))}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all',
                        paidAmount === finalTotal
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-surface-50 text-primary-600 border-surface-200 hover:bg-surface-100'
                      )}
                    >
                      Pas
                    </button>
                    {QUICK_AMOUNTS.filter((a) => a >= finalTotal).slice(0, 3).map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setPaidInput(String(amt))}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-all',
                          paidAmount === amt
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-surface-50 text-primary-600 border-surface-200 hover:bg-surface-100'
                        )}
                      >
                        {formatCurrency(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Change */}
                  {paidAmount >= finalTotal && (
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
                <div className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-center">
                  <p className="font-body text-sm text-muted-500">
                    {method === 'QRIS' && 'QR code akan tampil untuk di-scan pelanggan'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── TRANSFER — shown at select step ── */}
          {paymentStep === 'select' && (method as string) === 'TRANSFER' && (
            <TransferDisplay
              amount={finalTotal}
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
                  amount={finalTotal}
                  onConfirm={handleNonCashSuccess}
                />
              )}
              {method === 'TRANSFER' && (
                <TransferDisplay
                  amount={finalTotal}
                  onConfirm={handleNonCashSuccess}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer — only show on select step */}
        {paymentStep === 'select' && method !== 'TRANSFER' && (
          <div className="px-6 pb-5 pt-3 border-t border-surface-200 flex gap-3 flex-shrink-0">
            <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
            <button
              onClick={handleProceed}
              disabled={!canPay || saveTx.isPending}
              className={cn(
                'flex-1 flex items-center justify-center gap-2',
                'bg-primary-600 hover:bg-primary-700 text-white font-body font-medium',
                'px-5 py-2.5 rounded-xl transition-all shadow-warm',
                (!canPay || saveTx.isPending) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saveTx.isPending ? (
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
          <div className="px-6 pb-5 pt-3 border-t border-surface-200 flex-shrink-0">
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
