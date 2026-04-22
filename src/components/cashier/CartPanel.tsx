import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Plus, Minus, Tag, ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../stores/cartStore'
import { formatCurrency, cn } from '../../lib/utils'
import PaymentModal from './PaymentModal'
import { useOnlineStatus } from '../../hooks/useOfflineSync'
import SuccessModal from './SuccessModal'

interface CartPanelProps {
  triggerPay?: number
  triggerDiscount?: number
}

export default function CartPanel({ triggerPay, triggerDiscount }: CartPanelProps) {
  const { items, discount, setDiscount, updateQuantity, removeItem, subtotal, total } = useCartStore()
  const [showPayment, setShowPayment] = useState(false)
  const [successTx, setSuccessTx] = useState<{ id: string; total: number; change: number } | null>(null)
  const [discountInput, setDiscountInput] = useState('')
  const [showDiscount, setShowDiscount] = useState(false)

  const { t } = useTranslation()
  const isOnline = useOnlineStatus()
  const isEmpty = items.length === 0

  // Keyboard shortcut — trigger pay
  useEffect(() => {
    if (triggerPay && !isEmpty) setShowPayment(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerPay])

  // Keyboard shortcut — trigger discount
  useEffect(() => {
    if (triggerDiscount) setShowDiscount((v) => !v)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerDiscount])

  const handleDiscountApply = () => {
    const val = parseInt(discountInput.replace(/\D/g, '')) || 0
    setDiscount(val)
    setShowDiscount(false)
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white border-l border-dough-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-dough-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-crust-500" />
            <span className="font-display text-base font-semibold text-oven-800">Keranjang</span>
          </div>
          {!isEmpty && (
            <span className="bg-crust-600 text-cream text-xs font-body font-medium px-2 py-0.5 rounded-full">
              {items.reduce((s, i) => s + i.quantity, 0)} item
            </span>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-2">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-crust-300">
              <ShoppingCart className="w-10 h-10" />
              <p className="font-body text-sm">Pilih produk untuk memulai</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="bg-dough-50 rounded-xl px-3 py-2.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-oven-700 leading-snug flex-1">
                    {item.product.name}
                  </p>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-crust-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-crust-500">
                    {formatCurrency(item.product.price)} / pcs
                  </span>

                  {/* Quantity control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-dough-300 flex items-center justify-center
                                 text-crust-600 hover:bg-crust-50 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-sm font-medium text-oven-800 w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-crust-600 flex items-center justify-center
                                 text-cream hover:bg-crust-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span className="font-body text-sm font-semibold text-crust-700">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="px-4 py-4 border-t border-dough-100 space-y-3">
            {/* Discount */}
            <button
              onClick={() => setShowDiscount(!showDiscount)}
              className="flex items-center gap-1.5 text-crust-500 hover:text-crust-700 text-sm font-body transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              {discount > 0 ? `Diskon: ${formatCurrency(discount)}` : 'Tambah Diskon'}
            </button>

            {showDiscount && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('cashier.discountAmount')}
                  className="input text-sm py-2 flex-1"
                  autoFocus
                />
                <button onClick={handleDiscountApply} className="btn-primary px-3 py-2 text-sm">
                  OK
                </button>
              </div>
            )}

            {/* Summary */}
            <div className="space-y-1">
              <div className="flex justify-between font-body text-sm text-crust-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between font-body text-sm text-green-600">
                  <span>Diskon</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-display text-xl font-semibold text-oven-800 pt-1">
                <span>Total</span>
                <span>{formatCurrency(total())}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPayment(true)}
              className={cn(
                'w-full py-3 rounded-xl font-body font-semibold text-base',
                'bg-crust-600 hover:bg-crust-700 text-cream shadow-warm',
                'transition-all duration-200 active:scale-[0.98]'
              )}
            >
              {!isOnline && (
                <span className="mr-2 text-xs bg-amber-400 text-oven-900 px-1.5 py-0.5 rounded font-medium">
                  OFFLINE
                </span>
              )}
              Proses Pembayaran
            </button>
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={(txId, changeAmount) => {
            setShowPayment(false)
            setSuccessTx({ id: txId, total: total(), change: changeAmount ?? 0 })
          }}
        />
      )}

      {successTx && (
        <SuccessModal
          transactionId={successTx.id}
          total={successTx.total}
          change={successTx.change}
          onNewTransaction={() => setSuccessTx(null)}
        />
      )}
    </>
  )
}
