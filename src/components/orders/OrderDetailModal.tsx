import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  X, Phone, Calendar, Package, CheckCircle,
  Loader2, CreditCard, ChevronRight, Printer,
  ArrowRight, AlertTriangle,
} from 'lucide-react'
import { preOrderApi, type PreOrder, type OrderStatus } from '../../services/preOrderService'
import { useOrderReceipt } from './OrderReceipt'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency, cn } from '../../lib/utils'

interface OrderDetailModalProps {
  order: PreOrder
  onClose: () => void
}

const STATUS_FLOW: { key: OrderStatus; label: string; color: string; bg: string }[] = [
  { key: 'PENDING',       label: 'Menunggu',     color: 'text-gray-600',   bg: 'bg-gray-100' },
  { key: 'CONFIRMED',     label: 'Dikonfirmasi', color: 'text-blue-700',   bg: 'bg-blue-100' },
  { key: 'IN_PRODUCTION', label: 'Diproduksi',   color: 'text-accent-600',  bg: 'bg-gold-200' },
  { key: 'READY',         label: 'Siap Ambil',   color: 'text-green-700',  bg: 'bg-green-100' },
  { key: 'COMPLETED',     label: 'Selesai',      color: 'text-primary-600',  bg: 'bg-surface-100' },
]

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING:       'CONFIRMED',
  CONFIRMED:     'IN_PRODUCTION',
  IN_PRODUCTION: 'READY',
  READY:         'COMPLETED',
}

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; color: string }>> = {
  PENDING:       { label: 'Konfirmasi Pesanan', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  CONFIRMED:     { label: 'Mulai Produksi',     color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  IN_PRODUCTION: { label: 'Tandai Siap Ambil',  color: 'bg-green-600 hover:bg-green-700 text-white' },
  READY:         { label: 'Selesaikan Pesanan', color: 'bg-primary-600 hover:bg-primary-700 text-white' },
}

export default function OrderDetailModal({ order: initialOrder, onClose }: OrderDetailModalProps) {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.role === 'OWNER'

  const [payAmount, setPayAmount] = useState('')
  const [showPay, setShowPay] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Always fetch fresh order data
  const { data: order = initialOrder } = useQuery({
    queryKey: ['pre-order', initialOrder.id],
    queryFn: () => preOrderApi.get(initialOrder.id),
    initialData: initialOrder,
    refetchOnMount: true,
    staleTime: 0,
  })

  const { print: printReceipt } = useOrderReceipt(order)

  const currentIdx = STATUS_FLOW.findIndex((s) => s.key === order.status)
  const nextStatus = NEXT_STATUS[order.status]
  const nextAction = NEXT_ACTION[order.status]

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => preOrderApi.updateStatus(order.id, status),
    onSuccess: (_, status) => {
      qc.invalidateQueries({ queryKey: ['pre-orders'] })
      qc.invalidateQueries({ queryKey: ['pre-order', order.id] })
      const label = STATUS_FLOW.find(s => s.key === status)?.label ?? ''
      setSuccessMsg(`Status diperbarui: ${label}`)
      setConfirmCancel(false)
      setTimeout(() => setSuccessMsg(''), 3000)
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        setTimeout(() => onClose(), 1500)
      }
    },
  })

  const payMutation = useMutation({
    mutationFn: () => preOrderApi.payRemaining(order.id, parseInt(payAmount.replace(/\D/g, ''))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pre-orders'] })
      qc.invalidateQueries({ queryKey: ['pre-order', order.id] })
      setShowPay(false)
      setPayAmount('')
      setSuccessMsg('Pelunasan berhasil dicatat')
      setTimeout(() => setSuccessMsg(''), 3000)
    },
  })

  const pickupDate = new Date(order.pickupDate)
  const isOverdue = pickupDate < new Date() && !['COMPLETED', 'CANCELLED'].includes(order.status)
  const isCancelled = order.status === 'CANCELLED'
  const isCompleted = order.status === 'COMPLETED'

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 flex-shrink-0">
          <div>
            <h2 className="font-display text-lg font-semibold text-dark-800">{order.customerName}</h2>
            <p className="font-body text-xs text-muted-400">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isCancelled && (
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-body font-medium',
                STATUS_FLOW.find(s => s.key === order.status)?.bg,
                STATUS_FLOW.find(s => s.key === order.status)?.color,
              )}>
                {STATUS_FLOW.find(s => s.key === order.status)?.label}
              </span>
            )}
            {isCancelled && (
              <span className="px-2.5 py-1 rounded-full text-xs font-body font-medium bg-red-100 text-red-600">
                Dibatalkan
              </span>
            )}
            <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="font-body text-sm text-green-700">{successMsg}</p>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin">

          {/* Progress bar */}
          {!isCancelled && (
            <div className="space-y-2">
              <div className="flex items-center">
                {STATUS_FLOW.map((s, i) => {
                  const isPast = i <= currentIdx
                  const isCurrent = i === currentIdx
                  return (
                    <div key={s.key} className="flex items-center flex-1">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                        isCurrent ? 'bg-primary-600 ring-4 ring-surface-100' :
                        isPast ? 'bg-surface-500' : 'bg-surface-200'
                      )}>
                        {isPast && !isCurrent && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        {isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={cn(
                          'flex-1 h-1 mx-1 rounded-full transition-all',
                          i < currentIdx ? 'bg-surface-500' : 'bg-surface-200'
                        )} />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between">
                {STATUS_FLOW.map((s, i) => (
                  <p key={s.key} className={cn(
                    'font-body text-[10px] text-center',
                    i === currentIdx ? 'text-primary-700 font-semibold' : 'text-muted-400'
                  )} style={{ width: `${100 / STATUS_FLOW.length}%` }}>
                    {s.label}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-50 rounded-xl px-4 py-3 flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-400 flex-shrink-0" />
              <div>
                <p className="font-body text-xs text-muted-400">Nomor HP</p>
                <p className="font-body text-sm font-medium text-dark-800">{order.customerPhone || '—'}</p>
              </div>
            </div>
            <div className={cn(
              'rounded-xl px-4 py-3 flex items-center gap-3',
              isOverdue ? 'bg-red-50' : 'bg-surface-50'
            )}>
              <Calendar className={cn('w-4 h-4 flex-shrink-0', isOverdue ? 'text-red-400' : 'text-muted-400')} />
              <div>
                <p className="font-body text-xs text-muted-400">Pengambilan</p>
                <p className={cn('font-body text-sm font-medium', isOverdue ? 'text-red-600' : 'text-dark-800')}>
                  {pickupDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{' '}
                  {pickupDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  {isOverdue && ' ⚠️'}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-muted-400" />
              <p className="font-body text-sm font-medium text-dark-800">Produk Dipesan</p>
            </div>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-dark-700">{item.product.name}</p>
                    {item.customNotes && (
                      <p className="font-body text-xs text-muted-400 italic mt-0.5">"{item.customNotes}"</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-body text-xs text-muted-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    <p className="font-body text-sm font-semibold text-dark-800">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-surface-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between font-body text-sm">
              <span className="text-muted-500">Total pesanan</span>
              <span className="font-semibold text-dark-800">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between font-body text-sm">
              <span className="text-muted-500">DP dibayar</span>
              <span className="font-medium text-green-700">{formatCurrency(order.dpAmount)}</span>
            </div>
            <div className="flex justify-between font-body text-sm border-t border-surface-200 pt-2">
              <span className="text-muted-500 font-medium">Sisa pembayaran</span>
              <span className={cn('font-semibold', order.remainingAmount === 0 ? 'text-green-600' : 'text-orange-600')}>
                {order.remainingAmount === 0
                  ? '✓ Lunas'
                  : formatCurrency(order.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Pay remaining */}
          {order.remainingAmount > 0 && !isCancelled && (
            <div>
              {showPay ? (
                <div className="space-y-3 bg-surface-50 rounded-xl p-4">
                  <p className="font-body text-sm font-medium text-dark-800">Catat Pelunasan</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-muted-400">Rp</span>
                      <input
                        type="text"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value.replace(/\D/g, ''))}
                        placeholder={String(order.remainingAmount)}
                        className="input pl-9 font-mono"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => setPayAmount(String(order.remainingAmount))}
                      className="btn-secondary text-sm px-3"
                    >
                      Lunas
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowPay(false)} className="btn-secondary flex-1 text-sm">Batal</button>
                    <button
                      onClick={() => payMutation.mutate()}
                      disabled={payMutation.isPending || !payAmount}
                      className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                    >
                      {payMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Simpan
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPay(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-orange-200
                             bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-500" />
                    <span className="font-body text-sm font-medium text-orange-700">
                      Catat Pelunasan · {formatCurrency(order.remainingAmount)}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400" />
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-surface-50 rounded-xl px-4 py-3">
              <p className="font-body text-xs text-muted-400 mb-1">Catatan</p>
              <p className="font-body text-sm text-dark-700">{order.notes}</p>
            </div>
          )}

          {/* Cancel confirmation */}
          {confirmCancel && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-sm font-semibold text-red-700">Batalkan pesanan ini?</p>
                  <p className="font-body text-xs text-red-500 mt-0.5">Tindakan ini tidak bisa dibatalkan.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmCancel(false)} className="btn-secondary flex-1 text-sm">Tidak</button>
                <button
                  onClick={() => statusMutation.mutate('CANCELLED')}
                  disabled={statusMutation.isPending}
                  className="flex-1 text-sm bg-red-500 hover:bg-red-600 text-white font-body font-medium
                             px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {statusMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Ya, Batalkan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-surface-200 flex gap-3 flex-shrink-0">
          <button
            onClick={printReceipt}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-body font-medium
                       text-primary-600 border border-surface-200 hover:bg-surface-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Struk
          </button>

          {isOwner && !isCompleted && !isCancelled && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="px-4 py-2.5 rounded-xl text-sm font-body font-medium text-red-500
                         border border-red-200 hover:bg-red-50 transition-colors"
            >
              Batalkan
            </button>
          )}

          <div className="flex-1" />

          {isCompleted && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-body text-sm font-medium">Pesanan selesai</span>
            </div>
          )}

          {nextStatus && nextAction && !isCancelled && !confirmCancel && (
            <button
              onClick={() => statusMutation.mutate(nextStatus)}
              disabled={statusMutation.isPending}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-body font-semibold text-sm transition-all',
                nextAction.color,
                statusMutation.isPending && 'opacity-70'
              )}
            >
              {statusMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ArrowRight className="w-4 h-4" />
              }
              {nextAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
