import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, TrendingUp, Trash2,
  Loader2, ClipboardList, DollarSign,
  Clock, Users,
} from 'lucide-react'
import { reportApi } from '../services/reportService'
import api from '../lib/api'
import ExportButton from '../components/reports/ExportButton'
import { exportToExcel, exportTableToPDF, formatRupiah } from '../lib/exportUtils'
import { cn } from '../lib/utils'
import SalesChart from '../components/charts/SalesChart'

type Tab = 'sales' | 'products' | 'waste' | 'orders' | 'profit' | 'shifts' | 'cashiers'

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'sales',     label: 'Penjualan',   icon: BarChart3 },
  { key: 'products',  label: 'Produk',       icon: TrendingUp },
  { key: 'waste',     label: 'Waste',        icon: Trash2 },
  { key: 'orders',    label: 'Pesanan',      icon: ClipboardList },
  { key: 'profit',    label: 'Laba Rugi',    icon: DollarSign },
  { key: 'shifts',    label: 'Shift',        icon: Clock },
  { key: 'cashiers',  label: 'Kasir',        icon: Users },
]

export default function ReportsPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('sales')

  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [from, setFrom] = useState(firstDayOfMonth.toISOString().split('T')[0])
  const [to, setTo]     = useState(today.toISOString().split('T')[0])

  const { data: summary }     = useQuery({ queryKey: ['reports', 'dashboard'], queryFn: reportApi.dashboard })
  const { data: salesData,    isLoading: loadingSales }    = useQuery({ queryKey: ['reports', 'sales', from, to],    queryFn: () => reportApi.salesSummary({ from, to }),          enabled: tab === 'sales' })
  const { data: topProducts,  isLoading: loadingProducts } = useQuery({ queryKey: ['reports', 'products', from, to], queryFn: () => reportApi.topProducts({ from, to }),    enabled: tab === 'products' })
  const { data: wasteData,    isLoading: loadingWaste }    = useQuery({ queryKey: ['waste', from, to],               queryFn: () => reportApi.waste({ from, to }),          enabled: tab === 'waste' })
  const { data: ordersData }  = useQuery({ queryKey: ['reports', 'orders', from, to],  queryFn: () => reportApi.ordersReport({ from, to }),   enabled: tab === 'orders' })
  const { data: profitData }  = useQuery({ queryKey: ['reports', 'profit-loss', from, to], queryFn: async () => (await api.get('/reports/profit-loss', { params: { from, to } })).data, enabled: tab === 'profit' })
  const { data: shiftsData,   isLoading: loadingShifts }   = useQuery({ queryKey: ['reports', 'shifts', from, to],  queryFn: async () => (await api.get('/reports/shifts',   { params: { from, to } })).data as ShiftReport[], enabled: tab === 'shifts' })
  const { data: cashiersData, isLoading: loadingCashiers } = useQuery({ queryKey: ['reports', 'cashiers', from, to],queryFn: async () => (await api.get('/reports/cashiers', { params: { from, to } })).data as CashierReport[], enabled: tab === 'cashiers' })

  const STATUS_LABEL: Record<string, string> = { PENDING: 'Menunggu', CONFIRMED: 'Dikonfirmasi', IN_PRODUCTION: 'Diproduksi', READY: 'Siap Ambil', COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan' }

  interface ShiftReport {
    id: string
    openedAt: string
    closedAt: string | null
    duration: number | null
    isOpen: boolean
    openingCash: number
    closingCash: number | null
    cashDiff: number | null
    notes: string | null
    user: { id: string; name: string }
    outlet: { id: string; name: string }
    txCount: number
    totalSales: number
    totalDiscount: number
    byPayment: Record<string, number>
  }

  interface CashierReport {
    user: { id: string; name: string; role: string }
    txCount: number
    totalSales: number
    totalDiscount: number
    shiftCount: number
    avgPerTx: number
  }

  const PAY_LABEL: Record<string, string> = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', SPLIT: 'Split' }

  return (
    <div className="space-y-5">
      {/* Date range */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="font-display text-xl font-bold text-dark-800 flex-1">{t('nav.reports')}</h1>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input text-sm py-1.5 w-36" />
          <span className="font-body text-sm text-muted-400">–</span>
          <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input text-sm py-1.5 w-36" />
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Penjualan Hari Ini', value: formatRupiah(summary.todaySales ?? 0) },
            { label: 'Transaksi Hari Ini', value: String(summary.transactionCount ?? 0) },
            { label: 'Diproduksi Hari Ini', value: String(summary.totalProduced ?? 0) },
            { label: 'Stok Menipis',        value: String(summary.lowStockCount ?? 0) },
          ].map(card => (
            <div key={card.label} className="card">
              <p className="font-body text-xs text-muted-400">{card.label}</p>
              <p className="font-display text-xl font-bold text-dark-800 mt-1">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all',
              tab === key ? 'bg-primary-600 text-white shadow-warm' : 'bg-white text-muted-500 hover:bg-surface-100 border border-surface-200'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">

        {/* ── SALES TAB ── */}
        {tab === 'sales' && (loadingSales ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-muted-400 animate-spin" /></div>
        ) : salesData ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <ExportButton options={[
                { label: 'Export Excel', format: 'excel', onExport: () => exportToExcel(`laporan-penjualan-${from}-${to}`, [{
                  name: 'Penjualan',
                  headers: ['Tanggal', 'Transaksi', 'Pendapatan', 'Diskon'],
                  rows: (salesData.daily ?? []).map((d: { date: string; transactions: number; revenue: number; discount: number }) =>
                    [d.date, d.transactions, d.revenue, d.discount]
                  ),
                }]) },
                { label: 'Export PDF', format: 'pdf', onExport: () => exportTableToPDF({
                  title: 'Laporan Penjualan',
                  subtitle: `${from} – ${to}`,
                  headers: ['Tanggal', 'Transaksi', 'Pendapatan', 'Diskon'],
                  rows: (salesData.daily ?? []).map((d: { date: string; transactions: number; revenue: number; discount: number }) =>
                    [d.date, String(d.transactions), formatRupiah(d.revenue), formatRupiah(d.discount)]
                  ),
                }) },
              ]} />
            </div>
            <div className="card">
              <p className="font-body text-sm font-semibold text-dark-800 mb-3">Ringkasan Penjualan</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><p className="font-body text-xs text-muted-400">Total Transaksi</p><p className="font-display text-2xl font-bold text-dark-800">{salesData.totalTransactions}</p></div>
                <div><p className="font-body text-xs text-muted-400">Total Pendapatan</p><p className="font-display text-2xl font-bold text-dark-800">{formatRupiah(salesData.totalRevenue)}</p></div>
                <div><p className="font-body text-xs text-muted-400">Total Diskon</p><p className="font-display text-2xl font-bold text-orange-500">{formatRupiah(salesData.totalDiscount)}</p></div>
              </div>
            </div>
          </div>
        ) : null)}

        {/* ── TOP PRODUCTS TAB ── */}
        {tab === 'products' && (loadingProducts ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-muted-400 animate-spin" /></div>
        ) : topProducts && topProducts.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <ExportButton options={[
                { label: 'Export Excel', format: 'excel', onExport: () => exportToExcel(`produk-terlaris-${from}-${to}`, [{
                  name: 'Produk Terlaris',
                  headers: ['Rank', 'Nama Produk', 'Qty Terjual', 'Total Pendapatan'],
                  rows: topProducts.map((p, i) => [i + 1, p.product.name, p.totalSold, p.totalRevenue]),
                }]) },
                { label: 'Export PDF', format: 'pdf', onExport: () => exportTableToPDF({
                  title: 'Produk Terlaris',
                  subtitle: `${from} – ${to}`,
                  headers: ['Rank', 'Nama Produk', 'Qty Terjual', 'Total Pendapatan'],
                  rows: topProducts.map((p, i) => [String(i + 1), p.product.name, String(p.totalSold), formatRupiah(p.totalRevenue)]),
                }) },
              ]} />
            </div>
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="text-left px-5 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest w-8">#</th>
                    <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Produk</th>
                    <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Qty</th>
                    <th className="text-right px-5 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={p.product.id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-3 font-body text-sm text-muted-400">{i + 1}</td>
                      <td className="px-4 py-3 font-body text-sm font-medium text-dark-800">{p.product.name}</td>
                      <td className="px-4 py-3 font-body text-sm text-primary-600 text-right">{p.totalSold}</td>
                      <td className="px-5 py-3 font-body text-sm font-semibold text-dark-800 text-right">{formatRupiah(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <p className="font-body text-sm text-muted-400 text-center py-12">Tidak ada data produk</p>)}

        {/* ── WASTE TAB ── */}
        {tab === 'waste' && (loadingWaste ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-muted-400 animate-spin" /></div>
        ) : wasteData ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <ExportButton options={[
                { label: 'Export Excel', format: 'excel', onExport: () => exportToExcel(`waste-${from}-${to}`, [{
                  name: 'Waste',
                  headers: ['Produk', 'Qty Waste', 'Unsold', 'Estimasi Kerugian'],
                  rows: (wasteData.items ?? []).map((w: { productName: string; totalWaste: number; totalUnsold: number; estimatedLoss: number }) =>
                    [w.productName, w.totalWaste, w.totalUnsold, w.estimatedLoss]
                  ),
                }]) },
                { label: 'Export PDF', format: 'pdf', onExport: () => exportTableToPDF({
                  title: 'Laporan Waste',
                  subtitle: `${from} – ${to}`,
                  headers: ['Produk', 'Qty Waste', 'Unsold', 'Estimasi Kerugian'],
                  rows: (wasteData.items ?? []).map((w: { productName: string; totalWaste: number; totalUnsold: number; estimatedLoss: number }) =>
                    [w.productName, String(w.totalWaste), String(w.totalUnsold), formatRupiah(w.estimatedLoss)]
                  ),
                }) },
              ]} />
            </div>
            <div className="card">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><p className="font-body text-xs text-muted-400">Total Waste</p><p className="font-display text-2xl font-bold text-orange-500">{wasteData.totalWaste} pcs</p></div>
                <div><p className="font-body text-xs text-muted-400">Estimasi Kerugian</p><p className="font-display text-2xl font-bold text-red-600">{formatRupiah(wasteData.totalLoss)}</p></div>
              </div>
              {(wasteData.items ?? []).length > 0 && (
                <div className="space-y-2 mt-4">
                  {(wasteData.items ?? []).map((w: { productName: string; totalWaste: number; totalUnsold: number; estimatedLoss: number }) => (
                    <div key={w.productName} className="flex justify-between py-1.5 border-b border-surface-200 last:border-0">
                      <span className="font-body text-sm text-dark-800">{w.productName}</span>
                      <div className="text-right">
                        <span className="font-body text-sm font-semibold text-orange-500">{w.totalWaste} waste</span>
                        <span className="font-body text-xs text-muted-400 ml-2">{formatRupiah(w.estimatedLoss)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null)}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (!ordersData ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-muted-400 animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-end">
              <ExportButton options={[
                { label: 'Export Excel', format: 'excel', onExport: () => exportToExcel(`laporan-pesanan-${from}-${to}`, [{
                  name: 'Pesanan',
                  headers: ['Pelanggan', 'Status', 'Total', 'DP', 'Sisa', 'Tgl Ambil', 'Tgl Pesanan', 'Item'],
                  rows: ordersData.orders.map((o: { customerName: string; status: string; total: number; dpAmount: number; remainingAmount: number; pickupDate: string; createdAt: string; itemCount: number }) =>
                    [o.customerName, STATUS_LABEL[o.status] ?? o.status, o.total, o.dpAmount, o.remainingAmount, new Date(o.pickupDate).toLocaleDateString('id-ID'), new Date(o.createdAt).toLocaleDateString('id-ID'), o.itemCount]
                  ),
                }]) },
                { label: 'Export PDF', format: 'pdf', onExport: () => exportTableToPDF({
                  title: 'Laporan Pesanan',
                  subtitle: `${from} – ${to}`,
                  headers: ['Pelanggan', 'Status', 'Total', 'DP', 'Sisa', 'Tgl Ambil'],
                  rows: ordersData.orders.map((o: { customerName: string; status: string; total: number; dpAmount: number; remainingAmount: number; pickupDate: string }) =>
                    [o.customerName, STATUS_LABEL[o.status] ?? o.status, formatRupiah(o.total), formatRupiah(o.dpAmount), formatRupiah(o.remainingAmount), new Date(o.pickupDate).toLocaleDateString('id-ID')]
                  ),
                }) },
              ]} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Pesanan',  value: String(ordersData.totalOrders), sub: `${ordersData.completionRate}% selesai` },
                { label: 'Nilai Pesanan',  value: formatRupiah(ordersData.totalValue), sub: 'total' },
                { label: 'DP Terkumpul',  value: formatRupiah(ordersData.totalDP), sub: `Sisa ${formatRupiah(ordersData.totalRemaining)}` },
                { label: 'Selesai/Batal', value: `${ordersData.totalCompleted}/${ordersData.totalCancelled}`, sub: '' },
              ].map(card => (
                <div key={card.label} className="card">
                  <p className="font-body text-xs text-muted-400">{card.label}</p>
                  <p className="font-display text-xl font-bold text-dark-800 mt-1">{card.value}</p>
                  {card.sub && <p className="font-body text-xs text-muted-400 mt-0.5">{card.sub}</p>}
                </div>
              ))}
            </div>
            {ordersData.topProducts.length > 0 && (
              <div className="card">
                <p className="font-body text-sm font-semibold text-dark-800 mb-3">Produk Terlaris (Pre-Order)</p>
                <div className="space-y-2">
                  {ordersData.topProducts.map((p: { name: string; qty: number; revenue: number }, i: number) => (
                    <div key={p.name} className="flex items-center justify-between py-1.5 border-b border-surface-200 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-body text-xs text-muted-400 w-5">{i + 1}.</span>
                        <span className="font-body text-sm text-dark-800">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-body text-sm font-semibold text-dark-800">{formatRupiah(p.revenue)}</span>
                        <span className="font-body text-xs text-muted-400 ml-2">{p.qty} pcs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="card">
              <p className="font-body text-sm font-semibold text-dark-800 mb-3">Daftar Pesanan</p>
              {ordersData.orders.length === 0 ? (
                <p className="font-body text-sm text-muted-400 text-center py-6">Tidak ada pesanan di periode ini</p>
              ) : (
                <div className="space-y-2">
                  {ordersData.orders.map((o: { id: string; customerName: string; status: string; total: number; remainingAmount: number; pickupDate: string; itemCount: number }) => (
                    <div key={o.id} className="flex items-center justify-between py-2 border-b border-surface-200 last:border-0 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-semibold text-dark-800 truncate">{o.customerName}</p>
                        <p className="font-body text-xs text-muted-400">{new Date(o.pickupDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} · {o.itemCount} item</p>
                      </div>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-body font-medium flex-shrink-0',
                        o.status === 'COMPLETED' ? 'bg-surface-100 text-primary-600' : o.status === 'CANCELLED' ? 'bg-red-100 text-red-500' : 'bg-gold-200 text-accent-600'
                      )}>{STATUS_LABEL[o.status] ?? o.status}</span>
                      <div className="text-right flex-shrink-0">
                        <p className="font-body text-sm font-semibold text-dark-800">{formatRupiah(o.total)}</p>
                        {o.remainingAmount > 0 && <p className="font-body text-xs text-orange-500">Sisa {formatRupiah(o.remainingAmount)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* ── PROFIT-LOSS TAB ── */}
        {tab === 'profit' && (!profitData ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-muted-400 animate-spin" /></div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-end">
              <ExportButton options={[
                { label: 'Export Excel', format: 'excel', onExport: () => exportToExcel(`laba-rugi-${from}-${to}`, [
                  { name: 'Ringkasan', headers: ['Keterangan', 'Jumlah'], rows: [
                    ['Total Pendapatan', profitData.revenue.total],
                    ['Penjualan Kasir', profitData.revenue.kasir],
                    ['Pre-order Selesai', profitData.revenue.orders],
                    ['Total Diskon', -profitData.revenue.discount],
                    ['', ''],
                    ['Total Pengeluaran', profitData.cost.total],
                    ['Pembelian Bahan Baku', profitData.cost.purchases],
                    ['', ''],
                    ['Laba Kotor', profitData.profit.gross],
                    ['Margin (%)', profitData.profit.grossMargin],
                  ]},
                  { name: 'Tren Harian', headers: ['Tanggal', 'Pendapatan', 'Pengeluaran', 'Laba/Rugi'],
                    rows: profitData.daily.map((d: { date: string; revenue: number; cost: number }) => [d.date, d.revenue, d.cost, d.revenue - d.cost]),
                  },
                ]) },
                { label: 'Export PDF', format: 'pdf', onExport: () => exportTableToPDF({
                  title: 'Laporan Laba Rugi',
                  subtitle: `${from} – ${to}`,
                  headers: ['Keterangan', 'Jumlah'],
                  rows: [
                    ['Total Pendapatan', formatRupiah(profitData.revenue.total)],
                    ['  Penjualan Kasir', formatRupiah(profitData.revenue.kasir)],
                    ['  Pre-order Selesai', formatRupiah(profitData.revenue.orders)],
                    ['  Diskon', `- ${formatRupiah(profitData.revenue.discount)}`],
                    ['Total Pengeluaran', formatRupiah(profitData.cost.total)],
                    ['  Pembelian Bahan Baku', formatRupiah(profitData.cost.purchases)],
                    ['LABA KOTOR', formatRupiah(profitData.profit.gross)],
                    ['Margin', `${profitData.profit.grossMargin}%`],
                  ],
                }) },
              ]} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card">
                <p className="font-body text-xs text-muted-400">Total Pendapatan</p>
                <p className="font-display text-xl font-bold text-green-700 mt-1">{formatRupiah(profitData.revenue.total)}</p>
                <p className="font-body text-xs text-muted-400 mt-0.5">Kasir + Pre-order</p>
              </div>
              <div className="card">
                <p className="font-body text-xs text-muted-400">HPP (Bahan Baku)</p>
                <p className="font-display text-xl font-bold text-red-600 mt-1">{formatRupiah(profitData.cost.purchases)}</p>
                <p className="font-body text-xs text-muted-400 mt-0.5">Pembelian bahan baku</p>
              </div>
              <div className="card">
                <p className="font-body text-xs text-muted-400">Biaya Operasional</p>
                <p className="font-display text-xl font-bold text-orange-500 mt-1">{formatRupiah(profitData.operationalExpenses?.total ?? 0)}</p>
                <p className="font-body text-xs text-muted-400 mt-0.5">Gaji, sewa, listrik, dll</p>
              </div>
              <div className={cn('card', profitData.profit.net >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                <p className="font-body text-xs text-muted-400">Laba Bersih</p>
                <p className={cn('font-display text-xl font-bold mt-1', profitData.profit.net >= 0 ? 'text-green-700' : 'text-red-600')}>
                  {profitData.profit.net >= 0 ? '+' : ''}{formatRupiah(profitData.profit.net)}
                </p>
                <p className="font-body text-xs text-muted-400 mt-0.5">Margin {profitData.profit.netMargin ?? profitData.profit.grossMargin}%</p>
              </div>
            </div>
            <div className="card">
              <p className="font-body text-sm font-semibold text-dark-800 mb-3">Rincian Pendapatan</p>
              <div className="space-y-2">
                {[
                  { label: 'Penjualan kasir', value: profitData.revenue.kasir, color: 'text-green-700' },
                  { label: 'Pre-order selesai', value: profitData.revenue.orders, color: 'text-green-700' },
                  { label: 'Total diskon', value: -profitData.revenue.discount, color: 'text-orange-500' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-1.5 border-b border-surface-200 font-body text-sm">
                    <span className="text-muted-500">{row.label}</span>
                    <span className={cn('font-semibold', row.color)}>{row.value < 0 ? '-' : ''}{formatRupiah(Math.abs(row.value))}</span>
                  </div>
                ))}
                {Object.entries(profitData.revenue.byPayment as Record<string, number>).map(([method, amount]) => {
                  const labels: Record<string, string> = { CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer', SPLIT: 'Split' }
                  return (
                    <div key={method} className="flex justify-between py-1 font-body text-xs">
                      <span className="text-muted-400 pl-4">↳ {labels[method] ?? method}</span>
                      <span className="text-muted-500">{formatRupiah(amount)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="card">
              <p className="font-body text-sm font-semibold text-dark-800 mb-3">Rincian Pengeluaran</p>
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-surface-200 font-body text-sm">
                  <span className="text-muted-500">Pembelian bahan baku</span>
                  <span className="font-semibold text-red-600">{formatRupiah(profitData.cost.purchases)}</span>
                </div>
                {profitData.cost.waste > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-surface-200 font-body text-sm">
                    <span className="text-muted-500">Estimasi nilai waste</span>
                    <span className="font-semibold text-orange-500">{formatRupiah(profitData.cost.waste)}</span>
                  </div>
                )}
              </div>
            </div>
            {profitData.daily.length > 1 && (
              <div className="card">
                <p className="font-body text-sm font-semibold text-dark-800 mb-4">Tren Harian — Pendapatan vs Pengeluaran</p>
                <SalesChart
                  data={profitData.daily.map((d: { date: string; revenue: number; cost: number; expenses?: number }) => ({
                    date: d.date,
                    revenue: d.revenue,
                    expenses: (d.cost ?? 0) + (profitData.operationalExpenses?.total
                      ? Math.round(profitData.operationalExpenses.total / Math.max(profitData.daily.length, 1))
                      : 0),
                  }))}
                  height={240}
                  showExpenses={true}
                />
              </div>
            )}
            {(profitData.operationalExpenses?.total ?? 0) === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="font-body text-xs text-amber-700">
                  💡 Tambahkan biaya operasional (gaji, sewa, listrik) di menu <strong>Pengeluaran</strong> agar laba bersih lebih akurat.
                </p>
              </div>
            )}
          </div>
        ))}

        {/* ── SHIFTS TAB ── */}
        {tab === 'shifts' && (loadingShifts ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-muted-400 animate-spin" /></div>
        ) : !shiftsData || shiftsData.length === 0 ? (
          <div className="card p-12 text-center">
            <Clock className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="font-body text-sm text-muted-400">Tidak ada data shift di periode ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4">
                <p className="font-body text-xs text-muted-400">Total Shift</p>
                <p className="font-display text-2xl font-bold text-dark-800">{shiftsData.length}</p>
              </div>
              <div className="card p-4">
                <p className="font-body text-xs text-muted-400">Total Transaksi</p>
                <p className="font-display text-2xl font-bold text-primary-600">
                  {shiftsData.reduce((s, sh) => s + sh.txCount, 0)}
                </p>
              </div>
              <div className="card p-4">
                <p className="font-body text-xs text-muted-400">Total Penjualan</p>
                <p className="font-display text-2xl font-bold text-green-600">
                  {formatRupiah(shiftsData.reduce((s, sh) => s + sh.totalSales, 0))}
                </p>
              </div>
            </div>

            {/* Shift list */}
            {shiftsData.map((shift) => (
              <div key={shift.id} className={cn('card p-4', shift.isOpen && 'border-2 border-amber-300')}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-body text-sm font-semibold text-dark-800">{shift.user.name}</span>
                      <span className="font-body text-xs text-muted-400">@{shift.outlet.name}</span>
                      {shift.isOpen && (
                        <span className="bg-amber-100 text-amber-600 text-xs font-body font-medium px-2 py-0.5 rounded-full">Buka</span>
                      )}
                    </div>
                    <p className="font-body text-xs text-muted-400">
                      {new Date(shift.openedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      {shift.closedAt && ` → ${new Date(shift.closedAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                      {shift.duration !== null && ` (${shift.duration >= 60 ? `${Math.floor(shift.duration/60)}j ${shift.duration%60}m` : `${shift.duration}m`})`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-lg font-bold text-dark-800">{formatRupiah(shift.totalSales)}</p>
                    <p className="font-body text-xs text-muted-400">{shift.txCount} transaksi</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-surface-100">
                  <div>
                    <p className="font-body text-xs text-muted-400">Modal Awal</p>
                    <p className="font-body text-sm font-semibold text-dark-800">{formatRupiah(shift.openingCash)}</p>
                  </div>
                  {shift.closingCash !== null && (
                    <>
                      <div>
                        <p className="font-body text-xs text-muted-400">Uang Akhir</p>
                        <p className="font-body text-sm font-semibold text-dark-800">{formatRupiah(shift.closingCash)}</p>
                      </div>
                      <div>
                        <p className="font-body text-xs text-muted-400">Selisih</p>
                        <p className={cn('font-body text-sm font-semibold', (shift.cashDiff ?? 0) >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {(shift.cashDiff ?? 0) >= 0 ? '+' : ''}{formatRupiah(shift.cashDiff ?? 0)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* By payment */}
                {Object.keys(shift.byPayment).length > 0 && (
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {Object.entries(shift.byPayment).map(([pm, amt]) => (
                      <span key={pm} className="font-body text-xs text-muted-400 bg-surface-50 px-2 py-1 rounded-lg">
                        {PAY_LABEL[pm] ?? pm}: {formatRupiah(amt)}
                      </span>
                    ))}
                  </div>
                )}

                {shift.notes && (
                  <p className="font-body text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mt-2">{shift.notes}</p>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* ── CASHIERS TAB ── */}
        {tab === 'cashiers' && (loadingCashiers ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-muted-400 animate-spin" /></div>
        ) : !cashiersData || cashiersData.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="font-body text-sm text-muted-400">Tidak ada data kasir di periode ini</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="text-left px-5 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Kasir</th>
                    <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Shift</th>
                    <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Transaksi</th>
                    <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Avg/Transaksi</th>
                    <th className="text-right px-5 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Total Penjualan</th>
                  </tr>
                </thead>
                <tbody>
                  {cashiersData.filter(r => r.txCount > 0).map((r, i) => (
                    <tr key={r.user.id} className={cn('border-b border-surface-50 transition-colors hover:bg-surface-50', i === 0 && 'bg-green-50/50')}>
                      <td className="px-5 py-3">
                        <p className="font-body text-sm font-semibold text-dark-800">{r.user.name}</p>
                        <p className="font-body text-xs text-muted-400 capitalize">{r.user.role.toLowerCase()}</p>
                      </td>
                      <td className="px-4 py-3 font-body text-sm text-muted-500 text-right">{r.shiftCount}</td>
                      <td className="px-4 py-3 font-body text-sm text-primary-600 font-medium text-right">{r.txCount}</td>
                      <td className="px-4 py-3 font-body text-sm text-muted-500 text-right">{formatRupiah(r.avgPerTx)}</td>
                      <td className="px-5 py-3 font-body text-sm font-semibold text-dark-800 text-right">{formatRupiah(r.totalSales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {cashiersData.filter(r => r.txCount > 0).length === 0 && (
              <p className="font-body text-sm text-muted-400 text-center py-6">Tidak ada transaksi di periode ini</p>
            )}
          </div>
        ))}

      </div>
    </div>
  )
}
