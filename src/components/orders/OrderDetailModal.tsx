import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X, Phone, Calendar, Package, CheckCircle,
  Loader2, CreditCard, ChevronRight, Printer,
} from 'lucide-react'
import { preOrderApi, type PreOrder, type OrderStatus } from '../../services/preOrderService'
import { useOrderReceipt } from './OrderReceipt'
import { useAuthStore } from '../../stores/authStore'
import { formatCurrency, cn } from '../../lib/utils'

interface OrderDetailModalProps {
  order: PreOrder
  onClose: () => void
}

const STATUS_FLOW: { key: OrderStatus; label: string; color: string }[] = [
  { key: 'PENDING',       label: 'Menunggu',     color: 'bg-gray-100 text-gray-600' },
  { key: 'CONFIRMED',     label: 'Dikonfirmasi', color: 'bg-blue-100 text-blue-700' },
  { key: 'IN_PRODUCTION', label: 'Diproduksi',   color: 'bg-amber-100 text-amber-700' },
  { key: 'READY',         label: 'Siap ambil',   color: 'bg-green-100 text-green-700' },
  { key: 'COMPLETED',     label: 'Selesai',      color: 'bg-crust-100 text-crust-700' },
  { key: 'CANCELLED',     label: 'Dibatalkan',   color: 'bg-red-100 text-red-600' },
]

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'IN_PRODUCTION',
  IN_PRODUCTION: 'READY',
  READY: 'COMPLETED',
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Konfirmasi Pesanan',
  CONFIRMED: 'Mulai Produksi',
  IN_PRODUCTION: 'Tandai Siap',
  READY: 'Selesaikan',
}

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.role === 'OWNER'
  const { print: printReceipt } = useOrderReceipt(order)

  const [payAmount, setPayAmount] = useState('')
  const [showPay, setShowPay] = useState(false)

  const statusInfo = STATUS_FLOW.find((s) => s.key === order.status) ?? STATUS_FLOW[0]
  const nextStatus = NEXT_STATUS[order.status]
  const nextLabel = NEXT_LABEL[order.status]

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => preOrderApi.updateStatus(order.id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pre-orders'] }),
  })

  const payMutation = useMutation({
    mutationFn: () => preOrderApi.payRemaining(order.id, parseInt(payAmount.replace(/\D/g, ''))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pre-orders'] })
      setShowPay(false)
      setPayAmount('')
    },
  })

  const pickupDate = new Date(order.pickupDate)
  const isOverdue = pickupDate < new Date() && !['COMPLETED', 'CANCELLED'].includes(order.status)

  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100 flex-shrink-0">
          <div>
            <h2 className="font-display text-lg font-semibold text-oven-800">{order.customerName}</h2>
            <p className="font-body text-xs text-crust-400">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-2.5 py-1 rounded-full text-xs font-body font-medium', statusInfo.color)}>
              {statusInfo.label}
            </span>
            <button onClick={onClose} className="text-crust-400 hover:text-crust-600 transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dough-50 rounded-xl px-4 py-3 flex items-center gap-3">
              <Phone className="w-4 h-4 text-crust-400 flex-shrink-0" />
              <div>
                <p className="font-body text-xs text-crust-400">Nomor HP</p>
                <p className="font-body text-sm font-medium text-oven-800">{order.customerPhone}</p>
              </div>
            </div>
            <div className={cn(
              'rounded-xl px-4 py-3 flex items-center gap-3',
              isOverdue ? 'bg-red-50' : 'bg-dough-50'
            )}>
              <Calendar className={cn('w-4 h-4 flex-shrink-0', isOverdue ? 'text-red-400' : 'text-crust-400')} />
              <div>
                <p className="font-body text-xs text-crust-400">Pengambilan</p>
                <p className={cn('font-body text-sm font-medium', isOverdue ? 'text-red-600' : 'text-oven-800')}>
                  {pickupDate.toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}{' '}
                  {pickupDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  {isOverdue && ' ⚠️'}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-crust-400" />
              <p className="font-body text-sm font-medium text-oven-800">Produk Dipesan</p>
            </div>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-oven-700">{item.product.name}</p>
                    {item.customNotes && (
                      <p className="font-body text-xs text-crust-400 italic mt-0.5">
                        "{item.customNotes}"
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-body text-xs text-crust-400">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                    <p className="font-body text-sm font-semibold text-oven-800">{formatCurrency(item.subtotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-dough-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between font-body text-sm">
              <span className="text-crust-500">Total pesanan</span>
              <span className="font-semibold text-oven-800">{formatCurrency(order.total)}</span>
            </div>
            <div className="flex justify-between font-body text-sm">
              <span className="text-crust-500">DP dibayar</span>
              <span className="font-medium text-green-700">{formatCurrency(order.dpAmount)}</span>
            </div>
            <div className="flex justify-between font-body text-sm border-t border-dough-200 pt-2">
              <span className="text-crust-500 font-medium">Sisa pembayaran</span>
              <span className={cn(
                'font-semibold',
                order.remainingAmount === 0 ? 'text-green-600' : 'text-oven-800'
              )}>
                {order.remainingAmount === 0 ? 'Lunas ✓' : formatCurrency(order.remainingAmount)}
              </span>
            </div>
          </div>

          {/* Pay remaining */}
          {order.remainingAmount > 0 && order.status !== 'CANCELLED' && (
            <div>
              {showPay ? (
                <div className="space-y-2">
                  <label className="block text-sm font-body font-medium text-crust-700">
                    Jumlah pembayaran
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-crust-400">Rp</span>
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
                    <button onClick={() => setShowPay(false)} className="btn-secondary flex-1 text-sm">
                      Batal
                    </button>
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
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dough-300
                             bg-dough-50 hover:bg-dough-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-crust-500" />
                    <span className="font-body text-sm font-medium text-crust-700">Catat Pelunasan</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-crust-400" />
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-dough-50 rounded-xl px-4 py-3">
              <p className="font-body text-xs text-crust-400 mb-1">Catatan</p>
              <p className="font-body text-sm text-oven-700">{order.notes}</p>
            </div>
          )}

          {/* Status progress */}
          <div>
            <p className="font-body text-xs font-medium text-crust-500 mb-2">Alur status</p>
            <div className="flex items-center gap-1">
              {STATUS_FLOW.filter((s) => s.key !== 'CANCELLED').map((s) => (
                <div key={s.key} className="flex items-center gap-1 flex-1">
                  <div className={cn(
                    'flex-1 h-1.5 rounded-full transition-all',
                    ['CONFIRMED', 'IN_PRODUCTION', 'READY', 'COMPLETED'].indexOf(order.status) >=
                    ['CONFIRMED', 'IN_PRODUCTION', 'READY', 'COMPLETED'].indexOf(s.key) ||
                    order.status === s.key
                      ? 'bg-crust-500'
                      : 'bg-dough-200'
                  )} />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {STATUS_FLOW.filter((s) => s.key !== 'CANCELLED').map((s) => (
                <p key={s.key} className={cn(
                  'font-body text-[10px]',
                  order.status === s.key ? 'text-crust-700 font-semibold' : 'text-crust-400'
                )}>
                  {s.label}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 pt-3 border-t border-dough-100 flex gap-3 flex-shrink-0">
          <button
            onClick={printReceipt}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-body font-medium
                       text-crust-600 border border-dough-200 hover:bg-dough-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Struk
          </button>

          {isOwner && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <button
              onClick={() => statusMutation.mutate('CANCELLED')}
              disabled={statusMutation.isPending}
              className="px-4 py-2.5 rounded-xl text-sm font-body font-medium text-red-500
                         border border-red-200 hover:bg-red-50 transition-colors"
            >
              Batalkan
            </button>
          )}

          <div className="flex-1" />

          {nextStatus && (
            <button
              onClick={() => statusMutation.mutate(nextStatus)}
              disabled={statusMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {statusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {nextLabel}
            </button>
          )}

          {order.status === 'COMPLETED' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-body text-sm font-medium">Pesanan selesai</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
