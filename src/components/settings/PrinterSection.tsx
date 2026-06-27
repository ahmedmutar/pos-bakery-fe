import { Bluetooth, BluetoothConnected, BluetoothOff, Printer, Wifi, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useBluetoothPrinter } from '../../hooks/useBluetoothPrinter'
import { usePrinterStore } from '../../stores/printerStore'
import { buildReceiptBytes } from '../../lib/escpos'
import { useAuthStore, type AuthUser } from '../../stores/authStore'
import { cn } from '../../lib/utils'

const STATUS_CONFIG = {
  idle:       { color: 'text-muted-400',   bg: 'bg-surface-100',  label: 'Tidak terhubung' },
  connecting: { color: 'text-accent-600',  bg: 'bg-amber-50',     label: 'Menghubungkan...' },
  connected:  { color: 'text-green-600',   bg: 'bg-green-50',     label: 'Terhubung' },
  printing:   { color: 'text-primary-600', bg: 'bg-primary-50',   label: 'Mencetak...' },
  error:      { color: 'text-red-600',     bg: 'bg-red-50',       label: 'Error' },
}

export default function PrinterSection() {
  const user = useAuthStore((s) => s.user) as AuthUser | null
  const { paperWidth, setPaperWidth } = usePrinterStore()
  const {
    isSupported, isConnected, deviceName, status, error,
    connect, disconnect, print,
  } = useBluetoothPrinter()

  const cfg = STATUS_CONFIG[status]

  const handleTestPrint = async () => {
    const bytes = buildReceiptBytes({
      tenantName:    user?.tenantName ?? 'NAMA TOKO',
      transactionId: 'TEST-0001',
      date:          new Date(),
      cashierName:   user?.name ?? 'Admin',
      items: [
        { name: 'Test Produk A', quantity: 2, unitPrice: 15000, subtotal: 30000 },
        { name: 'Test Produk B', quantity: 1, unitPrice: 25000, subtotal: 25000 },
      ],
      discount:      5000,
      total:         50000,
      paymentMethod: 'CASH',
      paidAmount:    50000,
      change:        0,
    })
    await print(bytes)
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="font-display text-lg font-bold text-dark-800">Printer Struk</h2>
        <p className="font-body text-sm text-muted-400 mt-0.5">
          Hubungkan printer thermal Bluetooth untuk cetak struk tanpa dialog browser.
        </p>
      </div>

      {/* Browser support warning */}
      {!isSupported && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-amber-800">Browser tidak didukung</p>
            <p className="font-body text-sm text-amber-700 mt-0.5">
              Web Bluetooth hanya tersedia di Chrome atau Edge. Cetak struk masih bisa via dialog print browser.
            </p>
          </div>
        </div>
      )}

      {/* Connection status card */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
              {status === 'connecting' || status === 'printing'
                ? <Loader2 className={cn('w-5 h-5 animate-spin', cfg.color)} />
                : isConnected
                ? <BluetoothConnected className={cn('w-5 h-5', cfg.color)} />
                : <Bluetooth className={cn('w-5 h-5', cfg.color)} />
              }
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-dark-800">
                {isConnected && deviceName ? deviceName : 'Printer Bluetooth'}
              </p>
              <p className={cn('font-body text-xs', cfg.color)}>{cfg.label}</p>
            </div>
          </div>

          {isConnected && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Siap Cetak
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="font-body text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={!isSupported || status === 'connecting'}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {status === 'connecting'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Menghubungkan...</>
                : <><Bluetooth className="w-4 h-4" /> Hubungkan Printer</>
              }
            </button>
          ) : (
            <>
              <button
                onClick={handleTestPrint}
                disabled={status === 'printing'}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                {status === 'printing'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Mencetak...</>
                  : <><Printer className="w-4 h-4" /> Test Cetak</>
                }
              </button>
              <button
                onClick={disconnect}
                className="btn-ghost flex items-center gap-2 text-red-600 hover:bg-red-50"
              >
                <BluetoothOff className="w-4 h-4" />
                Putuskan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Paper width setting */}
      <div className="card p-5">
        <p className="font-body text-sm font-semibold text-dark-800 mb-3">Lebar Kertas</p>
        <div className="flex gap-3">
          {([58, 80] as const).map((w) => (
            <button
              key={w}
              onClick={() => setPaperWidth(w)}
              className={cn(
                'flex-1 py-2.5 rounded-xl border-2 text-sm font-body font-medium transition-all',
                paperWidth === w
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-surface-200 text-muted-500 hover:border-surface-300'
              )}
            >
              {w}mm
            </button>
          ))}
        </div>
        <p className="font-body text-xs text-muted-400 mt-2">
          Sesuaikan dengan lebar gulungan kertas printer Anda.
        </p>
      </div>

      {/* Info & tips */}
      <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4 space-y-2">
        <p className="font-body text-xs font-semibold text-dark-700 flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-primary-500" />
          Cara menghubungkan printer
        </p>
        <ol className="space-y-1 font-body text-xs text-muted-500 list-decimal list-inside">
          <li>Nyalakan printer thermal Bluetooth Anda</li>
          <li>Aktifkan Bluetooth di laptop/komputer</li>
          <li>Klik tombol <strong>"Hubungkan Printer"</strong> di atas</li>
          <li>Pilih nama printer dari daftar yang muncul</li>
          <li>Setelah terhubung, klik <strong>"Test Cetak"</strong> untuk verifikasi</li>
        </ol>
        <p className="font-body text-xs text-muted-400 pt-1">
          Kompatibel dengan printer thermal 58mm & 80mm yang mendukung Bluetooth BLE (mis. Zjiang, Xprinter, iDPRT, dan merek serupa).
        </p>
      </div>
    </div>
  )
}
