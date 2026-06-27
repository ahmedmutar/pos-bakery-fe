import { useState } from 'react'
import { Globe, Copy, Check, ExternalLink, QrCode } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function PublicOrderSection() {
  const user = useAuthStore(s => s.user)
  const [copied, setCopied] = useState(false)

  const slug = (user as { slug?: string })?.slug ?? (user as { tenantSlug?: string })?.tenantSlug ?? ''
  const baseUrl = window.location.origin
  const publicUrl = `${baseUrl}/order/${slug}`

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="card p-6 space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-dark-800">Link Pre-Order Publik</h2>
          <p className="font-body text-xs text-muted-400">Bagikan link ini agar pelanggan bisa memesan tanpa aplikasi</p>
        </div>
      </div>

      {/* URL display */}
      <div className="space-y-2">
        <label className="block text-xs font-body font-semibold text-primary-700">Link Order Publik</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-surface-50 border border-surface-200 rounded-xl px-3 py-2.5 font-mono text-sm text-dark-700 overflow-hidden">
            <span className="truncate block">{publicUrl}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-body text-sm font-medium transition-all flex-shrink-0 ${
              copied ? 'bg-green-50 border-green-200 text-green-700' : 'btn-secondary'
            }`}
          >
            {copied ? <><Check className="w-4 h-4" /> Tersalin!</> : <><Copy className="w-4 h-4" /> Salin</>}
          </button>
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-body text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Buka halaman order publik
        </a>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
        <p className="font-body text-xs font-semibold text-blue-800 flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5" />
          Cara Kerja
        </p>
        <ul className="font-body text-xs text-blue-700 space-y-1.5">
          <li className="flex gap-2"><span className="font-bold text-blue-400">1.</span>Bagikan link ke pelanggan via WA, Instagram, atau cetak QR code</li>
          <li className="flex gap-2"><span className="font-bold text-blue-400">2.</span>Pelanggan browse produk, tambah ke keranjang, dan isi data diri</li>
          <li className="flex gap-2"><span className="font-bold text-blue-400">3.</span>Pesanan masuk otomatis ke halaman <strong>Pesanan</strong> dengan label "Online"</li>
          <li className="flex gap-2"><span className="font-bold text-blue-400">4.</span>Reseller bisa cantumkan nomor HP mereka agar order ter-track ke komisi</li>
        </ul>
      </div>

      {/* Share tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: '📱', title: 'WhatsApp', desc: 'Salin link dan kirim ke grup pelanggan' },
          { icon: '📸', title: 'Instagram', desc: 'Taruh di bio atau story swipe-up' },
          { icon: '🖨️', title: 'Print QR', desc: 'Scan QR langsung dari brosur / meja' },
        ].map(tip => (
          <div key={tip.title} className="bg-surface-50 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">{tip.icon}</div>
            <p className="font-body text-xs font-semibold text-dark-700">{tip.title}</p>
            <p className="font-body text-[11px] text-muted-400 mt-0.5">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
