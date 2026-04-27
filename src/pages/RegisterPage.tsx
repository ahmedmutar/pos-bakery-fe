import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Croissant, Loader2, ArrowLeft, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react'
import { authApi } from '../services/authService'
import { useAuthStore } from '../stores/authStore'
import api from '../lib/api'
import { cn } from '../lib/utils'

type Step = 'form' | 'otp' | 'done'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [step, setStep] = useState<Step>('form')
  const [tenantName, setTenantName] = useState('')
  const [slug, setSlug] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleTenantName = (val: string) => {
    setTenantName(val)
    setSlug(
      val.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 40)
    )
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!tenantName.trim()) errs.tenantName = 'Nama toko wajib diisi'
    if (!slug.trim()) errs.slug = 'Slug wajib diisi'
    if (!ownerName.trim()) errs.ownerName = 'Nama Anda wajib diisi'
    if (!email.trim()) errs.email = 'Email wajib diisi'
    if (!password || password.length < 8) errs.password = 'Password minimal 8 karakter'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Step 1: Send OTP
  const sendOtpMutation = useMutation({
    mutationFn: () => api.post('/auth/send-otp', { email, name: ownerName }),
    onSuccess: () => {
      setStep('otp')
      setErrors({})
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const msg = err.response?.data?.error ?? 'Gagal mengirim OTP. Coba lagi.'
      setErrors({ general: msg })
    },
  })

  // Step 2: Register with OTP
  const registerMutation = useMutation({
    mutationFn: () =>
      authApi.register({ tenantName, slug, ownerName, email, password, otp: otp.join('') }),
    onSuccess: (data) => {
      login(data.user, data.token)
      navigate('/app/dashboard')
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const msg = err.response?.data?.error ?? 'Pendaftaran gagal. Coba lagi.'
      setErrors({ otp: msg })
    },
  })

  const handleFormSubmit = () => {
    if (validate()) sendOtpMutation.mutate()
  }

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    if (next.every(d => d) && !next.some(d => !d)) {
      // Auto-submit when all 6 digits filled
      setTimeout(() => {
        if (next.join('').length === 6) registerMutation.mutate()
      }, 100)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
      setTimeout(() => registerMutation.mutate(), 100)
    }
    e.preventDefault()
  }

  return (
    <div className="min-h-screen bg-dough-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => step === 'otp' ? setStep('form') : navigate('/')}
          className="flex items-center gap-1.5 text-sm font-body text-crust-500 hover:text-crust-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 'otp' ? 'Ubah data pendaftaran' : 'Kembali ke beranda'}
        </button>

        <div className="bg-white rounded-2xl shadow-warm-lg p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-crust-600 rounded-xl flex items-center justify-center shadow-warm">
              <Croissant className="w-5 h-5 text-cream" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-oven-800">
                {step === 'otp' ? 'Verifikasi Email' : 'Daftar Roti POS'}
              </h1>
              <p className="font-body text-xs text-crust-400">
                {step === 'otp'
                  ? `Kode OTP dikirim ke ${email}`
                  : 'Mulai trial gratis 14 hari'}
              </p>
            </div>
          </div>

          {/* ── STEP 1: Form ── */}
          {step === 'form' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                    Nama Toko / Bakery *
                  </label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => handleTenantName(e.target.value)}
                    placeholder="Bakery Enak"
                    className={cn('input', errors.tenantName && 'border-red-400')}
                    autoFocus
                  />
                  {errors.tenantName && <p className="text-xs text-red-500 mt-1">{errors.tenantName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                    Nama Anda *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ahmad Mukhtar"
                    className={cn('input', errors.ownerName && 'border-red-400')}
                  />
                  {errors.ownerName && <p className="text-xs text-red-500 mt-1">{errors.ownerName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                    Slug URL *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="bakery-enak"
                    className={cn('input font-mono text-sm', errors.slug && 'border-red-400')}
                  />
                  {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@toko.com"
                    className={cn('input', errors.email && 'border-red-400')}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className={cn('input pr-10', errors.password && 'border-red-400')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-crust-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
              </div>

              {errors.general && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{errors.general}</p>
              )}

              <button
                onClick={handleFormSubmit}
                disabled={sendOtpMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendOtpMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Mail className="w-4 h-4" />
                }
                {sendOtpMutation.isPending ? 'Mengirim OTP...' : 'Lanjut — Verifikasi Email'}
              </button>

              <p className="font-body text-xs text-crust-400 text-center">
                Dengan mendaftar, Anda menyetujui{' '}
                <a href="/terms" target="_blank" className="underline text-crust-600">Syarat & Ketentuan</a>{' '}
                dan{' '}
                <a href="/privacy" target="_blank" className="underline text-crust-600">Kebijakan Privasi</a> kami.
              </p>

              <p className="font-body text-sm text-crust-500 text-center">
                Sudah punya akun?{' '}
                <Link to="/login" className="font-semibold text-crust-700 hover:text-oven-800 transition-colors">
                  Login
                </Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="bg-dough-50 rounded-xl px-4 py-3 flex items-start gap-3">
                <Mail className="w-4 h-4 text-crust-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-sm font-semibold text-oven-800">Cek email Anda</p>
                  <p className="font-body text-xs text-crust-400 mt-0.5">
                    Kode OTP 6 digit dikirim ke <strong>{email}</strong>. Berlaku 10 menit.
                  </p>
                </div>
              </div>

              {/* OTP input boxes */}
              <div>
                <label className="block text-xs font-body font-medium text-crust-700 mb-3 text-center">
                  Masukkan Kode OTP
                </label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={cn(
                        'w-11 h-12 text-center font-mono text-xl font-bold border-2 rounded-xl',
                        'focus:outline-none focus:ring-2 focus:ring-crust-400 transition-all',
                        digit ? 'border-crust-500 bg-dough-50' : 'border-dough-300 bg-white',
                        errors.otp && 'border-red-400'
                      )}
                    />
                  ))}
                </div>
                {errors.otp && (
                  <p className="text-xs text-red-500 mt-2 text-center">{errors.otp}</p>
                )}
              </div>

              <button
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isPending || otp.some(d => !d)}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {registerMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftar...</>
                  : <><CheckCircle className="w-4 h-4" /> Verifikasi & Daftar</>
                }
              </button>

              <div className="text-center">
                <button
                  onClick={() => sendOtpMutation.mutate()}
                  disabled={sendOtpMutation.isPending}
                  className="font-body text-xs text-crust-400 hover:text-crust-600 transition-colors"
                >
                  {sendOtpMutation.isPending ? 'Mengirim ulang...' : 'Tidak menerima kode? Kirim ulang'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
