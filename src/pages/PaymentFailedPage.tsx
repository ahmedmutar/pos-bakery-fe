import { useNavigate } from 'react-router-dom'
import { XCircle, RefreshCw } from 'lucide-react'

export default function PaymentFailedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dough-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-oven-800">Pembayaran Gagal</h1>
          <p className="font-body text-sm text-crust-400 mt-1">
            Transaksi tidak berhasil. Tidak ada dana yang ditagihkan.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
          <a
            href="https://wa.me/6285947566558?text=Halo, saya mengalami masalah saat pembayaran. Bisa minta bantuan?"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            Hubungi Kami
          </a>
        </div>
      </div>
    </div>
  )
}
