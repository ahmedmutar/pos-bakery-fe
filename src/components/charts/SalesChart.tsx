import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../../lib/utils'

export interface SalesChartDataPoint {
  date: string
  revenue: number
  expenses?: number
  transactions?: number
  profit?: number
}

interface SalesChartProps {
  data: SalesChartDataPoint[]
  height?: number
  showExpenses?: boolean
  showTransactions?: boolean
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-white border border-surface-200 rounded-xl shadow-warm p-3 text-xs font-body min-w-[160px]">
      <p className="font-semibold text-dark-700 mb-2">{label ? formatDateLabel(label) : ''}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-500">{entry.name}</span>
          </div>
          <span className="font-semibold text-dark-700">
            {entry.name === 'Transaksi' ? `${entry.value}x` : formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function SalesChart({
  data,
  height = 260,
  showExpenses = false,
  showTransactions = false,
}: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="font-body text-sm text-muted-400">Belum ada data untuk ditampilkan.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1E4D3B" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1E4D3B" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          tick={{ fontSize: 10, fontFamily: 'Nunito, sans-serif', fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : String(v)}
          tick={{ fontSize: 10, fontFamily: 'Nunito, sans-serif', fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} />
        {(showExpenses || showTransactions) && (
          <Legend
            wrapperStyle={{ fontSize: 11, fontFamily: 'Nunito, sans-serif', paddingTop: 8 }}
          />
        )}

        {/* Revenue area */}
        <Area
          type="monotone"
          dataKey="revenue"
          name="Penjualan"
          stroke="#1E4D3B"
          strokeWidth={2}
          fill="url(#colorRevenue)"
          dot={false}
          activeDot={{ r: 4, fill: '#1E4D3B', strokeWidth: 0 }}
        />

        {/* Expenses area — only when showExpenses */}
        {showExpenses && (
          <Area
            type="monotone"
            dataKey="expenses"
            name="Pengeluaran"
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            fill="url(#colorExpenses)"
            dot={false}
            activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
          />
        )}

        {/* Transaction count bars — only when showTransactions */}
        {showTransactions && (
          <Bar
            dataKey="transactions"
            name="Transaksi"
            fill="#FF8A00"
            fillOpacity={0.6}
            radius={[3, 3, 0, 0]}
            yAxisId={1}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
