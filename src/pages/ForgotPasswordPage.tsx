import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import api from '../lib/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post('/auth/forgot-password', { email })
      return res.data
    },
    onSuccess: () => setSent(true),
  })

  if (sent) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="font-display text-xl font-bold text-dark-800">Cek Email Anda</h1>
          <p className="font-body text-sm text-muted-500">
            Jika email <strong>{email}</strong> terdaftar, instruksi reset password akan dikirim. Periksa inbox dan folder spam.
          </p>
          <p className="font-body text-xs text-muted-400 bg-surface-50 rounded-xl px-4 py-3">
            Tidak ada email masuk? Hubungi owner atau admin toko untuk reset password manual.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm font-body text-muted-500 hover:text-primary-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </button>

        {/* Header */}
        <div>
          <div className="w-12 h-12 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-dark-800">Lupa Password</h1>
          <p className="font-body text-sm text-muted-400 mt-1">
            Masukkan email akun Anda. Kami akan kirim link reset password.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@toko.com"
              className="input"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && email && mutation.mutate(email)}
            />
          </div>

          {mutation.isError && (
            <p className="font-body text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
              Terjadi kesalahan. Coba lagi.
            </p>
          )}

          <button
            onClick={() => mutation.mutate(email)}
            disabled={mutation.isPending || !email}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Kirim Link Reset
          </button>
        </div>
      </div>
    </div>
  )
}
