import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X, Loader2, Receipt, ChevronDown, ChevronUp,
  Printer, AlertTriangle,
} from 'lucide-react'
import { transactionApi } from '../../services/transactionService'
import { useAuthStore } from '../../stores/authStore'
import { useThermalReceipt } from './ThermalReceipt'
import { formatCurrency } from '../../lib/utils'

interface TransactionHistoryPanelProps {
  onClose: () => void
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tunai',
  QRIS: 'QRIS',
  TRANSFER: 'Transfer',
  SPLIT: 'Campuran',
  CARD: 'Kartu',
}

function TransactionRow({ tx, onRefresh }: {
  tx: Awaited<ReturnType<typeof transactionApi.list>>[number]
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmVoid, setConfirmVoid] = useState(false)
  const { t } = useTranslation()
  const qc = useQueryClient()

  const voidMutation = useMutation({
    mutationFn: () => transactionApi.void(tx.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions-today'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onRefresh()
      setConfirmVoid(false)
      setExpanded(false)
    },
  })

  const isVoided = tx.notes?.startsWith('[VOID]')
  const user = useAuthStore((s) => s.user)
  const isOwner = user?.role === 'OWNER'
  const { print } = useThermalReceipt({ transactionId: tx.id, change: tx.changeAmount })

  return (
    <div className="border border-dough-200 rounded-xl overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-dough-50 transition-colors text-left"
      >
        <div className="w-8 h-8 bg-crust-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Receipt className="w-4 h-4 text-crust-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-medium text-oven-800">
              #{tx.id.slice(-6).toUpperCase()}
            </span>
            <span className="font-body text-xs bg-dough-100 text-crust-600 px-2 py-0.5 rounded-full">
              {PAYMENT_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
            </span>
          </div>
          <span className="font-body text-xs text-crust-400">
            {new Date(tx.createdAt).toLocaleTimeString('id-ID', {
              hour: '2-digit', minute: '2-digit',
            })}
            {' · '}
            {tx.items.length} item
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-display text-sm font-semibold text-oven-800">
            {formatCurrency(tx.total)}
          </span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-crust-400" />
            : <ChevronDown className="w-4 h-4 text-crust-400" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 bg-dough-50 border-t border-dough-100 space-y-3">
          {/* Items */}
          <div className="pt-3 space-y-1.5">
            {tx.items.map((item) => (
              <div key={item.id} className="flex justify-between font-body text-sm">
                <span className="text-oven-700">
                  {item.product.name}
                  <span className="text-crust-400 ml-1">×{item.quantity}</span>
                </span>
                <span className="text-oven-700">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Payment summary */}
          <div className="border-t border-dough-200 pt-2 space-y-1">
            {tx.discount > 0 && (
              <div className="flex justify-between font-body text-xs text-crust-500">
                <span>Diskon</span>
                <span>- {formatCurrency(tx.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-body text-sm font-semibold text-oven-800">
              <span>Total</span>
              <span>{formatCurrency(tx.total)}</span>
            </div>
            <div className="flex justify-between font-body text-xs text-crust-500">
              <span>{PAYMENT_LABELS[tx.paymentMethod] ?? tx.paymentMethod}</span>
              <span>{formatCurrency(tx.paidAmount)}</span>
            </div>
            {tx.changeAmount > 0 && (
              <div className="flex justify-between font-body text-xs text-crust-500">
                <span>Kembalian</span>
                <span>{formatCurrency(tx.changeAmount)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={print}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body
                         font-medium text-crust-600 border border-dough-200 bg-white hover:bg-dough-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Ulang
            </button>

            {isOwner && !isVoided && !confirmVoid && (
              <button
                onClick={() => setConfirmVoid(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body
                           font-medium text-red-500 border border-red-100 bg-white hover:bg-red-50 transition-colors ml-auto"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Void
              </button>
            )}

            {isVoided && (
              <span className="ml-auto font-body text-xs text-red-400 bg-red-50 px-2.5 py-1 rounded-lg">
                Divoid
              </span>
            )}

            {isOwner && confirmVoid && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="font-body text-xs text-red-600">{t('cashier.voidTransaction')}</span>
                <button
                  onClick={() => setConfirmVoid(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-body border border-dough-200 bg-white hover:bg-dough-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => voidMutation.mutate()}
                  disabled={voidMutation.isPending}
                  className="px-2.5 py-1 rounded-lg text-xs font-body font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {voidMutation.isPending ? '...' : 'Ya, Void'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TransactionHistoryPanel({ onClose }: TransactionHistoryPanelProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()

  // Get today's date range
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions-today', from, to],
    queryFn: () => transactionApi.list({ from, to }),
    refetchInterval: 30_000,
  })

  // Void = soft delete via backend (mark as cancelled)
  // For now we use a local filter — in production add a void endpoint
  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['transactions-today'] })
  }

  const visible = transactions.filter((tx) => !tx.notes?.startsWith('[VOID]'))

  const totalSales = visible.reduce((sum, tx) => sum + tx.total, 0)

  const byMethod = visible.reduce((acc, tx) => {
    acc[tx.paymentMethod] = (acc[tx.paymentMethod] ?? 0) + tx.total
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-oven-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[95vw] sm:max-w-md bg-white h-full flex flex-col shadow-warm-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dough-200 flex-shrink-0">
          <div>
            <h2 className="font-display text-lg font-semibold text-oven-800">
              Transaksi Hari Ini
            </h2>
            <p className="font-body text-xs text-crust-400">
              {visible.length} transaksi · {formatCurrency(totalSales)}
            </p>
          </div>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary strip */}
        {visible.length > 0 && (
          <div className="px-5 py-3 bg-dough-50 border-b border-dough-100 flex gap-4 flex-wrap flex-shrink-0">
            {Object.entries(byMethod).map(([method, total]) => (
              <div key={method} className="text-center">
                <p className="font-body text-xs text-crust-400">{PAYMENT_LABELS[method] ?? method}</p>
                <p className="font-body text-sm font-semibold text-oven-800">{formatCurrency(total)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Transaction list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-crust-300">
              <Receipt className="w-10 h-10" />
              <p className="font-body text-sm">{t('common.noData')}</p>
            </div>
          ) : (
            [...visible].reverse().map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onRefresh={handleRefresh}
              />
            ))
          )}
        </div>

        {/* Void disclaimer */}
        <div className="px-5 py-3 border-t border-dough-100 bg-dough-50 flex-shrink-0">
          <p className="font-body text-xs text-crust-400 text-center">
            Void hanya tersedia untuk Owner · Data transaksi tetap tersimpan di laporan
          </p>
        </div>
      </div>
    </div>
  )
}
