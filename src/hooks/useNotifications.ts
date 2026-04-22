import { useQuery } from '@tanstack/react-query'
import { reportApi } from '../services/reportService'
import { preOrderApi } from '../services/preOrderService'

export interface Notification {
  id: string
  type: 'low_stock' | 'pickup_today' | 'pickup_overdue'
  title: string
  message: string
  urgent: boolean
}

export function useNotifications() {
  const { data: summary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportApi.dashboard,
    refetchInterval: 2 * 60 * 1000, // every 2 minutes
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['pre-orders'],
    queryFn: () => preOrderApi.list(),
    refetchInterval: 2 * 60 * 1000,
  })

  const notifications: Notification[] = []

  // Low stock alerts
  if (summary?.lowStockItems) {
    for (const item of summary.lowStockItems) {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: 'low_stock',
        title: 'Stok menipis',
        message: `${item.name}: ${item.currentStock} ${item.baseUnit} (min ${item.minimumStock})`,
        urgent: item.currentStock <= 0,
      })
    }
  }

  // Today's pickups
  const today = new Date()
  const activeOrders = orders.filter(
    (o) => !['COMPLETED', 'CANCELLED'].includes(o.status)
  )

  for (const order of activeOrders) {
    const pickup = new Date(order.pickupDate)
    const isToday = pickup.toDateString() === today.toDateString()
    const isOverdue = pickup < today

    if (isOverdue) {
      notifications.push({
        id: `overdue-${order.id}`,
        type: 'pickup_overdue',
        title: 'Pesanan terlambat',
        message: `${order.customerName} — ${pickup.toLocaleDateString('id-ID', {
          day: 'numeric', month: 'short',
        })}`,
        urgent: true,
      })
    } else if (isToday) {
      notifications.push({
        id: `today-${order.id}`,
        type: 'pickup_today',
        title: 'Pengambilan hari ini',
        message: `${order.customerName} — ${pickup.toLocaleTimeString('id-ID', {
          hour: '2-digit', minute: '2-digit',
        })}`,
        urgent: false,
      })
    }
  }

  const urgentCount = notifications.filter((n) => n.urgent).length
  const totalCount = notifications.length

  return { notifications, urgentCount, totalCount }
}
