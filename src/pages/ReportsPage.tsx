import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, TrendingUp, Trash2, ShoppingBag,
  Loader2, ArrowDownRight,
} from 'lucide-react'
import { reportApi } from '../services/reportService'
import ExportButton from '../components/reports/ExportButton'
import { exportToExcel, exportTableToPDF, formatRupiah } from '../lib/exportUtils'
import { formatCurrency, cn } from '../lib/utils'

type Tab = 'sales' | 'products' | 'waste'

type Period = '7d' | '30d' | 'custom'

function getDateRange(period: Period, customFrom: string, customTo: string) {
  const to = new Date()
  const from = new Date()

  if (period === '7d') {
    from.setDate(from.getDate() - 7)
  } else if (period === '30d') {
    from.setDate(from.getDate() - 30)
  } else {
    return {
      from: customFrom,
      to: customTo,
    }
  }

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

export default function ReportsPage() {
  const { t } = useTranslation()
    const [tab, setTab] = useState<Tab>('sales')
  const [period, setPeriod] = useState<Period>('7d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const { from, to } = getDateRange(period, customFrom, customTo)

  const { data: summary } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportApi.dashboard,
  })

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['sales-summary', from, to],
    queryFn: () => reportApi.salesSummary({ from, to }),
    enabled: tab === 'sales',
  })

  const { data: topProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['top-products', from, to],
    queryFn: () => reportApi.topProducts({ from, to, limit: 20 }),
    enabled: tab === 'products',
  })

  const { data: wasteData, isLoading: loadingWaste } = useQuery({
    queryKey: ['waste', from, to],
    queryFn: () => reportApi.waste({ from, to }),
    enabled: tab === 'waste',
  })

  const TABS = [
    { key: 'sales' as Tab,    label: t('reports.sales'),      icon: TrendingUp },
    { key: 'products' as Tab, label: t('reports.topProducts'), icon: ShoppingBag },
    { key: 'waste' as Tab,    label: 'Waste',           icon: Trash2 },
  ]

  const PERIODS: { key: Period; label: string }[] = [
    { key: '7d',     label: '7 hari' },
    { key: '30d',    label: '30 hari' },
    { key: 'custom', label: 'Custom' },
  ]

  const maxRevenue = topProducts?.[0]?.totalRevenue ?? 1

  return (
    <div className="space-y-5">
      {/* Today summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {
            label: 'Penjualan hari ini',
            value: formatCurrency(summary?.todaySales ?? 0),
            sub: `${summary?.transactionCount ?? 0} transaksi`,
            icon: TrendingUp,
            color: 'bg-crust-100 text-crust-600',
            positive: true,
          },
          {
            label: 'Diproduksi hari ini',
            value: `${summary?.totalProduced ?? 0} pcs`,
            sub: 'total produksi',
            icon: BarChart3,
            color: 'bg-dough-100 text-dough-600',
            positive: true,
          },
          {
            label: 'Waste hari ini',
            value: `${summary?.totalWaste ?? 0} pcs`,
            sub: 'sisa & reject',
            icon: Trash2,
            color: 'bg-red-50 text-red-400',
            positive: false,
          },
          {
            label: 'Stok menipis',
            value: `${summary?.lowStockCount ?? 0} bahan`,
            sub: 'perlu restock',
            icon: ArrowDownRight,
            color: 'bg-amber-50 text-amber-500',
            positive: summary?.lowStockCount === 0,
          },
        ].map(({ label, value, sub, icon: Icon, color, positive }) => (
          <div key={label} className="card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs text-crust-400">{label}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="font-display text-xl font-semibold text-oven-800">{value}</p>
            <p className={cn('font-body text-xs', positive ? 'text-green-600' : 'text-red-400')}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex bg-dough-100 rounded-xl p-1 gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all',
                tab === key
                  ? 'bg-white text-oven-800 shadow-warm'
                  : 'text-crust-500 hover:text-crust-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          <div className="flex bg-dough-100 rounded-xl p-1 gap-1">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all',
                  period === key
                    ? 'bg-white text-oven-800 shadow-warm'
                    : 'text-crust-500 hover:text-crust-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input text-sm py-2 w-36"
              />
              <span className="font-body text-sm text-crust-400">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input text-sm py-2 w-36"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── SALES TAB ── */}
      {tab === 'sales' && (
        loadingSales ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
          </div>
        ) : salesData ? (
          <div className="space-y-4">
            {/* Export */}
            <div className="flex justify-end">
              <ExportButton
                disabled={!salesData}
                options={[
                  {
                    label: 'Export Excel',
                    format: 'excel',
                    onExport: () => {
                      if (!salesData) return
                      exportToExcel(`laporan-penjualan-${from}-${to}`, [{
                        name: t('reports.sales'),
                        headers: ['Metode Bayar', 'Jumlah Transaksi', 'Total'],
                        rows: salesData.byPaymentMethod.map((m: { method: string; count: number; total: number }) => [
                          m.method, m.count, formatRupiah(m.total)
                        ]),
                      }])
                    },
                  },
                  {
                    label: 'Export PDF',
                    format: 'pdf',
                    onExport: () => {
                      if (!salesData) return
                      exportTableToPDF({
                        title: 'Laporan Penjualan',
                        subtitle: `Periode: ${from} s/d ${to}`,
                        headers: ['Metode Bayar', 'Transaksi', 'Total'],
                        rows: salesData.byPaymentMethod.map((m: { method: string; count: number; total: number }) => [
                          m.method, m.count, formatRupiah(m.total)
                        ]),
                        totalsRow: ['TOTAL', salesData.transactionCount, formatRupiah(salesData.totalRevenue)],
                      })
                    },
                  },
                ]}
              />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <div className="card">
                <p className="font-body text-xs text-crust-400 mb-1">Total Pendapatan</p>
                <p className="font-display text-2xl font-bold text-oven-800 tracking-tight">
                  {formatCurrency(salesData.totalRevenue)}
                </p>
              </div>
              <div className="card">
                <p className="font-body text-xs text-crust-400 mb-1">Total Transaksi</p>
                <p className="font-display text-2xl font-bold text-oven-800 tracking-tight">
                  {salesData.transactionCount}
                </p>
              </div>
              <div className="card">
                <p className="font-body text-xs text-crust-400 mb-1">Rata-rata per Transaksi</p>
                <p className="font-display text-2xl font-bold text-oven-800 tracking-tight">
                  {salesData.transactionCount > 0
                    ? formatCurrency(Math.round(salesData.totalRevenue / salesData.transactionCount))
                    : 'Rp 0'}
                </p>
              </div>
            </div>

            {/* By payment method */}
            <div className="card">
              <h3 className="font-display text-base font-semibold text-oven-800 mb-4">
                Per Metode Pembayaran
              </h3>
              {salesData.byPaymentMethod.length === 0 ? (
                <p className="font-body text-sm text-crust-400 text-center py-6">
                  Belum ada data transaksi
                </p>
              ) : (
                <div className="space-y-3">
                  {salesData.byPaymentMethod.map((m: {
                    method: string
                    total: number
                    count: number
                  }) => {
                    const pct = salesData.totalRevenue > 0
                      ? (m.total / salesData.totalRevenue) * 100
                      : 0
                    const labels: Record<string, string> = {
                      CASH: 'Tunai',
                      QRIS: 'QRIS',
                      TRANSFER: 'Transfer',
                      SPLIT: 'Campuran',
                    }
                    return (
                      <div key={m.method}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-body text-sm font-medium text-oven-700">
                              {labels[m.method] ?? m.method}
                            </span>
                            <span className="font-body text-xs text-crust-400">
                              {m.count} transaksi
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-body text-sm font-semibold text-oven-800">
                              {formatCurrency(m.total)}
                            </span>
                            <span className="font-body text-xs text-crust-400 ml-2">
                              {Math.round(pct)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-dough-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-crust-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Discount info */}
            {salesData.totalDiscount > 0 && (
              <div className="card flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-medium text-oven-700">Total Diskon Diberikan</p>
                  <p className="font-body text-xs text-crust-400">dalam periode ini</p>
                </div>
                <p className="font-display text-lg font-semibold text-red-500">
                  - {formatCurrency(salesData.totalDiscount)}
                </p>
              </div>
            )}
          </div>
        ) : null
      )}

      {/* ── TOP PRODUCTS TAB ── */}
      {tab === 'products' && (
        loadingProducts ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
          </div>
        ) : topProducts && topProducts.length > 0 ? (
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dough-100 bg-dough-50">
                  <th className="text-left px-5 py-3 font-body text-[10px] font-semibold text-crust-500 uppercase tracking-widest w-8">
                    #
                  </th>
                  <th className="text-left px-4 py-3 font-body text-[10px] font-semibold text-crust-500 uppercase tracking-widest">
                    Produk
                  </th>
                  <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-crust-500 uppercase tracking-widest">
                    Terjual
                  </th>
                  <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-crust-500 uppercase tracking-widest">
                    Pendapatan
                  </th>
                  <th className="px-4 py-3 w-40" />
                </tr>
              </thead>
              <tbody className="divide-y divide-dough-100">
                {topProducts.map((p, index) => {
                  const pct = (p.totalRevenue / maxRevenue) * 100
                  return (
                    <tr key={p.product.id} className="hover:bg-dough-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-crust-400">{index + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-body text-sm font-medium text-oven-800">{p.product.name}</p>
                        <p className="font-body text-xs text-crust-400">
                          {formatCurrency(p.product.price)} / pcs
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-body text-sm font-semibold text-oven-800">
                          {p.totalSold} pcs
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-display text-sm font-semibold text-crust-700">
                          {formatCurrency(p.totalRevenue)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full h-1.5 bg-dough-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-crust-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-crust-300">
            <ShoppingBag className="w-10 h-10" />
            <p className="font-body text-sm">Belum ada data penjualan di periode ini</p>
          </div>
        )
      )}

      {/* ── WASTE TAB ── */}
      {tab === 'waste' && (
        loadingWaste ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
          </div>
        ) : wasteData ? (
          <div className="space-y-4">
            {/* Export */}
            <div className="flex justify-end">
              <ExportButton
                disabled={!wasteData || wasteData.items.length === 0}
                options={[
                  {
                    label: 'Export Excel',
                    format: 'excel',
                    onExport: () => {
                      if (!wasteData) return
                      exportToExcel(`laporan-waste-${from}-${to}`, [{
                        name: 'Waste',
                        headers: ['Produk', 'Kategori', 'Reject (pcs)', 'Tidak Terjual (pcs)', 'Estimasi Kerugian'],
                        rows: wasteData.items.map((item: { productName: string; wasteCategory: string | null; wasteQty: number; unsoldQty: number; estimatedLoss: number }) => [
                          item.productName, item.wasteCategory ?? '-',
                          item.wasteQty, item.unsoldQty, formatRupiah(item.estimatedLoss)
                        ]),
                      }])
                    },
                  },
                  {
                    label: 'Export PDF',
                    format: 'pdf',
                    onExport: () => {
                      if (!wasteData) return
                      exportTableToPDF({
                        title: t('reports.wasteReport'),
                        subtitle: `Periode: ${from} s/d ${to}`,
                        headers: ['Produk', 'Kategori', 'Reject', 'Tidak Terjual', 'Kerugian'],
                        rows: wasteData.items.map((item: { productName: string; wasteCategory: string | null; wasteQty: number; unsoldQty: number; estimatedLoss: number }) => [
                          item.productName, item.wasteCategory ?? '-',
                          `${item.wasteQty} pcs`, `${item.unsoldQty} pcs`, formatRupiah(item.estimatedLoss)
                        ]),
                        totalsRow: ['TOTAL', '', '', '', formatRupiah(wasteData.totalWasteValue)],
                      })
                    },
                  },
                ]}
              />
            </div>

            {/* Total waste value */}
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              <div className="card">
                <p className="font-body text-xs text-crust-400 mb-1">Total Nilai Waste</p>
                <p className="font-display text-2xl font-semibold text-red-600">
                  {formatCurrency(wasteData.totalWasteValue)}
                </p>
                <p className="font-body text-xs text-crust-400 mt-1">estimasi kerugian</p>
              </div>
              <div className="card">
                <p className="font-body text-xs text-crust-400 mb-1">Total Produk Waste</p>
                <p className="font-display text-2xl font-bold text-oven-800 tracking-tight">
                  {wasteData.items.reduce((s: number, i: { wasteQty: number; unsoldQty: number }) =>
                    s + i.wasteQty + i.unsoldQty, 0)} pcs
                </p>
                <p className="font-body text-xs text-crust-400 mt-1">reject + tidak terjual</p>
              </div>
            </div>

            {/* Waste breakdown */}
            {wasteData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-crust-300">
                <Trash2 className="w-10 h-10" />
                <p className="font-body text-sm">Tidak ada waste di periode ini</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dough-100 bg-dough-50">
                      <th className="text-left px-5 py-3 font-body text-xs font-semibold text-crust-500 uppercase tracking-wide">
                        Produk
                      </th>
                      <th className="text-center px-4 py-3 font-body text-xs font-semibold text-crust-500 uppercase tracking-wide">
                        Kategori
                      </th>
                      <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-crust-500 uppercase tracking-widest">
                        Reject
                      </th>
                      <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-crust-500 uppercase tracking-widest">
                        Tidak terjual
                      </th>
                      <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-crust-500 uppercase tracking-widest">
                        Estimasi kerugian
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dough-100">
                    {wasteData.items.map((item: {
                      productName: string
                      wasteQty: number
                      unsoldQty: number
                      wasteCategory: string | null
                      estimatedLoss: number
                    }, i: number) => (
                      <tr key={i} className="hover:bg-dough-50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-body text-sm font-medium text-oven-800">{item.productName}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.wasteCategory ? (
                            <span className={cn(
                              'font-body text-xs px-2.5 py-0.5 rounded-full capitalize',
                              item.wasteCategory === 'expired' ? 'bg-red-100 text-red-600' :
                              item.wasteCategory === 'reject' ? 'bg-amber-100 text-amber-700' :
                              'bg-dough-100 text-crust-600'
                            )}>
                              {item.wasteCategory}
                            </span>
                          ) : (
                            <span className="text-crust-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-body text-sm text-oven-700">{item.wasteQty} pcs</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-body text-sm text-oven-700">{item.unsoldQty} pcs</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-body text-sm font-semibold text-red-500">
                            {formatCurrency(item.estimatedLoss)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-dough-200 bg-dough-50">
                      <td colSpan={4} className="px-5 py-3 font-body text-sm font-semibold text-oven-800">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-display text-base font-semibold text-red-600">
                        {formatCurrency(wasteData.totalWasteValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        ) : null
      )}
    </div>
  )
}
