import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  Plus, Search, Loader2, ClipboardList,
  Calendar, AlertCircle,
} from 'lucide-react'
import { preOrderApi, type PreOrder, type OrderStatus } from '../services/preOrderService'
import { formatCurrency, cn } from '../lib/utils'
import OrderFormModal from '../components/orders/OrderFormModal'
import OrderDetailModal from '../components/orders/OrderDetailModal'

const STATUS_CONFIG: Record<OrderStatus, { labelKey: string; color: string; dot: string }> = {
  PENDING:       { labelKey: 'orders.pending',       color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  CONFIRMED:     { labelKey: 'orders.confirmed',     color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  IN_PRODUCTION: { labelKey: 'orders.inProduction',  color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  READY:         { labelKey: 'orders.ready',         color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  COMPLETED:     { labelKey: 'orders.completed',     color: 'bg-surface-100 text-primary-600', dot: 'bg-muted-400' },
  CANCELLED:     { labelKey: 'orders.cancelled',     color: 'bg-red-100 text-red-500',     dot: 'bg-red-400' },
}

const FILTER_TABS: { key: 'active' | 'all'; labelKey: string }[] = [
  { key: 'active', labelKey: 'common.active' },
  { key: 'all',    labelKey: 'common.all' },
]

const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY']

export default function OrdersPage() {
  const { t } = useTranslation()
    const [showCreate, setShowCreate] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<PreOrder | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [tab, setTab] = useState<'active' | 'all'>('active')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['pre-orders'],
    queryFn: () => preOrderApi.list(),
  })

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search)
    const matchStatus = statusFilter ? o.status === statusFilter : true
    const matchTab = tab === 'all' ? true : ACTIVE_STATUSES.includes(o.status)
    return matchSearch && matchStatus && matchTab
  })

  // Sort: closest pickup date first for active, newest first for all
  const sorted = [...filtered].sort((a, b) => {
    if (tab === 'active') {
      return new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
    }
    return new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime()
  })

  const activeCount = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length
  const todayPickups = orders.filter((o) => {
    const d = new Date(o.pickupDate)
    const today = new Date()
    return d.toDateString() === today.toDateString() && o.status !== 'CANCELLED'
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-muted-400">
          {activeCount} pesanan aktif
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Pesanan Baru
        </button>
      </div>

      {/* Today's pickup alert */}
      {todayPickups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="font-body text-sm font-medium text-amber-800">
              {todayPickups.length} pesanan dijadwalkan diambil hari ini
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayPickups.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className="font-body text-xs bg-white border border-amber-200 text-amber-700
                           px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors"
              >
                {o.customerName} · {new Date(o.pickupDate).toLocaleTimeString('id-ID', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-surface-100 rounded-xl p-1 gap-1">
          {FILTER_TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-body font-medium transition-all',
                tab === key
                  ? 'bg-white text-dark-800 shadow-warm'
                  : 'text-muted-500 hover:text-primary-700'
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau nomor HP..."
            className="input pl-9"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="input w-auto min-w-36"
        >
          <option value="">Semua status</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{t(cfg.labelKey)}</option>
          ))}
        </select>
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-surface-300">
          <ClipboardList className="w-10 h-10" />
          <p className="font-body text-sm">
            {tab === 'active' ? 'Tidak ada pesanan aktif' : 'Belum ada pesanan'}
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            Buat pesanan pertama
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((order) => {
            const status = STATUS_CONFIG[order.status]
            const pickupDate = new Date(order.pickupDate)
            const isOverdue =
              pickupDate < new Date() && !['COMPLETED', 'CANCELLED'].includes(order.status)
            const daysUntil = Math.ceil(
              (pickupDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={cn(
                  'card hover:border-surface-300 cursor-pointer transition-all',
                  isOverdue && 'border-red-200 bg-red-50'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Status dot */}
                  <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', status.dot)} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-body text-sm font-semibold text-dark-800">
                        {order.customerName}
                      </p>
                      <span className={cn('text-xs font-body font-medium px-2.5 py-0.5 rounded-full flex-shrink-0', status.color)}>
                        {t(status.labelKey)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-body text-muted-400 mb-2">
                      <span>{order.customerPhone}</span>
                      <span>·</span>
                      <span className={cn(
                        'flex items-center gap-1',
                        isOverdue ? 'text-red-500 font-medium' :
                        daysUntil === 0 ? 'text-amber-600 font-medium' : ''
                      )}>
                        <Calendar className="w-3 h-3" />
                        {isOverdue
                          ? 'Terlambat!'
                          : daysUntil === 0
                          ? 'Hari ini'
                          : daysUntil === 1
                          ? 'Besok'
                          : pickupDate.toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short',
                            })
                        }
                        {' · '}
                        {pickupDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Items preview */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {order.items.slice(0, 3).map((item) => (
                        <span key={item.id} className="font-body text-xs bg-surface-100 text-primary-600 px-2 py-0.5 rounded-lg">
                          {item.product.name} ×{item.quantity}
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="font-body text-xs text-muted-400">
                          +{order.items.length - 3} lagi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price + payment */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-base font-bold text-dark-800 tracking-tight">
                      {formatCurrency(order.total)}
                    </p>
                    {order.remainingAmount > 0 ? (
                      <p className="font-body text-xs text-amber-600 mt-0.5">
                        Sisa {formatCurrency(order.remainingAmount)}
                      </p>
                    ) : (
                      <p className="font-body text-xs text-green-600 mt-0.5">Lunas ✓</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && <OrderFormModal onClose={() => setShowCreate(false)} />}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
