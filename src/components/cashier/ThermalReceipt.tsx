import { useQuery } from '@tanstack/react-query'
import { transactionApi } from '../../services/transactionService'
import { useAuthStore, type AuthUser } from '../../stores/authStore'
import { usePrint } from '../../hooks/usePrint'
import { formatCurrency } from '../../lib/utils'

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tunai',
  QRIS: 'QRIS',
  TRANSFER: 'Transfer',
  SPLIT: 'Campuran',
  CARD: 'Kartu',
}

interface UseThermalReceiptProps {
  transactionId: string
  change: number
}

export function useThermalReceipt({ transactionId, change }: UseThermalReceiptProps) {
  const user = useAuthStore((s) => s.user) as AuthUser | null
  const { printHTML } = usePrint()

  const { data: tx } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionApi.get(transactionId),
  })

  const print = () => {
    if (!tx) return

    const txDate = new Date(tx.createdAt)

    const itemsHTML = tx.items.map((item) => `
      <div class="receipt-item">
        <div class="receipt-item-name">${item.product.name}</div>
        <div class="receipt-row">
          <span>${item.quantity} x ${formatCurrency(item.unitPrice)}</span>
          <span>${formatCurrency(item.subtotal)}</span>
        </div>
      </div>
    `).join('')

    const logoHtml = user?.logoUrl
      ? `<img src="${user?.logoUrl}" alt="Logo" style="width:56px;height:56px;object-fit:contain;margin:0 auto 6px;display:block;" />`
      : ''

    const html = `
      <div class="receipt-header">
        ${logoHtml}
        <div class="receipt-title">${user?.tenantName?.toUpperCase() ?? 'TOKO'}</div>
        <div class="receipt-subtitle">Terima kasih atas kunjungan Anda</div>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-row"><span>No.</span><span>#${transactionId.slice(-8).toUpperCase()}</span></div>
      <div class="receipt-row"><span>Tgl</span><span>${txDate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
      <div class="receipt-row"><span>Jam</span><span>${txDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
      <div class="receipt-row"><span>Kasir</span><span>${tx.user?.name ?? '—'}</span></div>
      ${tx.outlet?.name ? `<div class="receipt-row"><span>Outlet</span><span>${tx.outlet.name}</span></div>` : ''}

      <div class="receipt-divider"></div>

      ${itemsHTML}

      <div class="receipt-divider"></div>

      ${tx.discount > 0 ? `<div class="receipt-row"><span>Diskon</span><span>- ${formatCurrency(tx.discount)}</span></div>` : ''}
      <div class="receipt-row receipt-total"><span>TOTAL</span><span>${formatCurrency(tx.total)}</span></div>
      <div class="receipt-row"><span>${PAYMENT_LABELS[tx.paymentMethod] ?? tx.paymentMethod}</span><span>${formatCurrency(tx.paidAmount)}</span></div>
      ${change > 0 ? `<div class="receipt-row"><span>Kembali</span><span>${formatCurrency(change)}</span></div>` : ''}

      <div class="receipt-divider"></div>

      <div class="receipt-footer">
        <div>Simpan struk ini sebagai bukti pembelian</div>
        <div class="receipt-stars">* * * * * * * * * *</div>
        <div class="receipt-powered">Powered by Roti POS</div>
      </div>
    `

    printHTML(html)
  }

  return { print, isReady: !!tx }
}
