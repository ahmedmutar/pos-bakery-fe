import { useAuthStore } from '../../stores/authStore'
import { usePrint } from '../../hooks/usePrint'
import type { PreOrder } from '../../services/preOrderService'
import { formatCurrency } from '../../lib/utils'

export function useOrderReceipt(order: PreOrder) {
  const user = useAuthStore((s) => s.user)
  const { printHTML } = usePrint()

  const print = () => {
    const now = new Date()
    const pickup = new Date(order.pickupDate)

    const itemsHTML = order.items.map((item) => `
      <div class="receipt-item">
        <div class="receipt-item-name">${item.product.name}</div>
        ${item.customNotes ? `<div class="receipt-item-note">* ${item.customNotes}</div>` : ''}
        <div class="receipt-row">
          <span>${item.quantity} x ${formatCurrency(item.unitPrice)}</span>
          <span>${formatCurrency(item.subtotal)}</span>
        </div>
      </div>
    `).join('')

    const html = `
      <div class="receipt-header">
        <div class="receipt-title">${user?.tenantName?.toUpperCase() ?? 'TOKO'}</div>
        <div class="receipt-subtitle" style="font-weight:bold;margin-top:4px;">TANDA TERIMA PRE-ORDER</div>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-row"><span>No. Pesanan</span><span>#${order.id.slice(-8).toUpperCase()}</span></div>
      <div class="receipt-row"><span>Tgl Pesan</span><span>${now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>
      <div class="receipt-row"><span>Ambil</span><span>${pickup.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${pickup.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>

      <div class="receipt-divider"></div>

      <div class="receipt-section-title">PELANGGAN</div>
      <div style="font-size:11px;">${order.customerName}</div>
      <div style="font-size:11px;">${order.customerPhone}</div>

      <div class="receipt-divider"></div>

      ${itemsHTML}

      <div class="receipt-divider"></div>

      <div class="receipt-row receipt-total"><span>TOTAL</span><span>${formatCurrency(order.total)}</span></div>
      <div class="receipt-row"><span>DP Dibayar</span><span>${formatCurrency(order.dpAmount)}</span></div>
      <div class="receipt-divider"></div>
      <div class="receipt-row receipt-total"><span>SISA PELUNASAN</span><span>${formatCurrency(order.remainingAmount)}</span></div>

      ${order.notes ? `<div class="receipt-divider"></div><div style="font-size:10px;font-style:italic;">Catatan: ${order.notes}</div>` : ''}

      <div class="receipt-divider"></div>

      <div class="receipt-footer">
        <div>Harap tunjukkan struk ini saat pengambilan</div>
        <div>Pelunasan dilakukan saat pengambilan</div>
        <div class="receipt-stars">* * * * * * * * * *</div>
        <div class="receipt-powered">Powered by Roti POS</div>
      </div>
    `

    printHTML(html)
  }

  return { print }
}
