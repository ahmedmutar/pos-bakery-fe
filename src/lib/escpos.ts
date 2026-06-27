// ESC/POS command builder for thermal printers (58mm / 80mm paper)

const ESC = 0x1b
const GS  = 0x1d
const LF  = 0x0a

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals)
}

function text(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

export const CMD = {
  init:          () => bytes(ESC, 0x40),
  lf:            () => bytes(LF),
  lf2:           () => bytes(LF, LF),
  lf3:           () => bytes(LF, LF, LF),
  alignLeft:     () => bytes(ESC, 0x61, 0x00),
  alignCenter:   () => bytes(ESC, 0x61, 0x01),
  alignRight:    () => bytes(ESC, 0x61, 0x02),
  boldOn:        () => bytes(ESC, 0x45, 0x01),
  boldOff:       () => bytes(ESC, 0x45, 0x00),
  doubleOn:      () => bytes(ESC, 0x21, 0x30), // double width + height
  doubleOff:     () => bytes(ESC, 0x21, 0x00),
  underlineOn:   () => bytes(ESC, 0x2d, 0x01),
  underlineOff:  () => bytes(ESC, 0x2d, 0x00),
  // Partial cut (leave 1 point uncut)
  cut:           () => bytes(GS, 0x56, 0x42, 0x03),
  // Full cut
  cutFull:       () => bytes(GS, 0x56, 0x00),
  // Feed n lines then cut
  feedCut:       (n = 4) => bytes(ESC, 0x64, n, GS, 0x56, 0x42, 0x03),
  // Horizontal line (dashes) — 32 chars for 58mm
  divider:       () => text('--------------------------------\n'),
  divider2:      () => text('================================\n'),
  line:          (str: string) => text(str + '\n'),
}

// Format right-aligned 2-column row in ~32 chars (58mm paper)
export function row(left: string, right: string, width = 32): Uint8Array {
  const pad = width - left.length - right.length
  const spaces = pad > 0 ? ' '.repeat(pad) : ' '
  return text(left + spaces + right + '\n')
}

// Build complete receipt bytes from data
interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface ReceiptData {
  tenantName: string
  transactionId: string
  date: Date
  cashierName?: string
  outletName?: string
  items: ReceiptItem[]
  discount: number
  total: number
  paymentMethod: string
  paidAmount: number
  change: number
}

function formatRp(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tunai', QRIS: 'QRIS', TRANSFER: 'Transfer',
  SPLIT: 'Campuran', CARD: 'Kartu',
}

export function buildReceiptBytes(data: ReceiptData): Uint8Array {
  const {
    tenantName, transactionId, date, cashierName, outletName,
    items, discount, total, paymentMethod, paidAmount, change,
  } = data

  const d = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const t = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const txId = '#' + transactionId.slice(-8).toUpperCase()

  const parts: Uint8Array[] = [
    CMD.init(),
    CMD.alignCenter(),
    CMD.doubleOn(),
    CMD.line(tenantName.toUpperCase()),
    CMD.doubleOff(),
    CMD.line('Terima kasih atas kunjungan Anda'),
    CMD.lf(),
    CMD.alignLeft(),
    CMD.divider(),
    row('No.', txId),
    row('Tgl', d),
    row('Jam', t),
  ]

  if (cashierName) parts.push(row('Kasir', cashierName))
  if (outletName)  parts.push(row('Outlet', outletName))

  parts.push(CMD.divider())

  for (const item of items) {
    const qtyLine = `${item.quantity} x ${formatRp(item.unitPrice)}`
    parts.push(
      CMD.boldOn(),
      CMD.line(item.name),
      CMD.boldOff(),
      row(qtyLine, formatRp(item.subtotal)),
    )
  }

  parts.push(CMD.divider())

  if (discount > 0) {
    parts.push(row('Diskon', '- ' + formatRp(discount)))
  }

  parts.push(
    CMD.boldOn(),
    row('TOTAL', formatRp(total)),
    CMD.boldOff(),
    row(PAYMENT_LABELS[paymentMethod] ?? paymentMethod, formatRp(paidAmount)),
  )

  if (change > 0) {
    parts.push(row('Kembali', formatRp(change)))
  }

  parts.push(
    CMD.divider(),
    CMD.alignCenter(),
    CMD.line('Simpan struk sebagai bukti'),
    CMD.line('* * * * * * * * * *'),
    CMD.line('Powered by Sajiin'),
    CMD.lf3(),
    CMD.cut(),
  )

  return concat(...parts)
}
