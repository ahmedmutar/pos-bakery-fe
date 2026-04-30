import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'

export default function PaymentSuccessPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const plan  = params.get('plan') ?? 'basic'
  const email = params.get('email') ?? ''
  // const name = params.get('name') ?? ''
  const store = params.get('store') ?? ''

  const PLAN_LABELS: Record<string, string> = {
    basic: 'Basic', pro: 'Pro', enterprise: 'Enterprise'
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold text-dark-800">Pembayaran Berhasil!</h1>
          {store && (
            <p className="font-body text-sm text-muted-500 mt-1">
              Paket <strong>{PLAN_LABELS[plan]}</strong> untuk <strong>{store}</strong>
            </p>
          )}
        </div>

        <div className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-4 text-left space-y-2">
          <p className="font-body text-sm font-semibold text-dark-800">Langkah selanjutnya:</p>
          <ol className="space-y-1.5">
            <li className="font-body text-sm text-primary-600 flex items-start gap-2">
              <span className="font-semibold text-muted-500 flex-shrink-0">1.</span>
              Tim kami akan menghubungi {email || 'email Anda'} dalam 1×24 jam untuk aktivasi akun
            </li>
            <li className="font-body text-sm text-primary-600 flex items-start gap-2">
              <span className="font-semibold text-muted-500 flex-shrink-0">2.</span>
              Atau langsung hubungi kami via WhatsApp untuk aktivasi lebih cepat
            </li>
          </ol>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/6285947566558?text=Halo, saya baru saja melakukan pembayaran paket ${PLAN_LABELS[plan]} untuk ${store}. Email: ${email}. Mohon bantu aktivasi akun saya.`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Hubungi via WhatsApp
          </a>
          <button
            onClick={() => navigate('/register')}
            className="btn-secondary w-full"
          >
            Daftar & Mulai Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
