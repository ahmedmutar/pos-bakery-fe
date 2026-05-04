import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, ArrowLeft, RefreshCw, Mail } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/authService'
import { SajiinIcon } from '../components/ui/SajiinLogo'
import { cn } from '../lib/utils'

type Step = 'credentials' | 'otp'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate     = useNavigate()
  const login        = useAuthStore((s) => s.login)

  const [step, setStep]         = useState<Step>('credentials')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const inputRefs               = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown(c => c - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const toggleLanguage = () => {
    const next = i18n.language === 'id' ? 'en' : 'id'
    i18n.changeLanguage(next)
    localStorage.setItem('language', next)
  }

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.login({ email, password })
      setStep('otp')
      setResendCooldown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Email atau kata sandi salah.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (code = otp.join('')) => {
    if (code.length < 6) return
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.loginVerify({ email, otp: code })
      login({ id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId, tenantName: user.tenantName }, token)
      navigate('/app/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Kode OTP tidak valid.'
      setError(msg)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    setLoading(true)
    try {
      await authApi.login({ email, password })
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch {
      setError('Gagal mengirim ulang OTP. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next  = [...otp]
    next[idx]   = digit
    setOtp(next)
    if (digit && idx < 5) inputRefs.current[idx + 1]?.focus()
    if (next.every(d => d !== '')) {
      const code = next.join('')
      setTimeout(() => handleVerifyOTP(code), 80)
    }
  }

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) { const n = [...otp]; n[idx] = ''; setOtp(n) }
      else if (idx > 0) inputRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputRefs.current[idx - 1]?.focus()
    if (e.key === 'ArrowRight' && idx < 5) inputRefs.current[idx + 1]?.focus()
    if (e.key === 'Enter') handleVerifyOTP()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    const next = ['', '', '', '', '', '']
    digits.split('').forEach((d, i) => { next[i] = d })
    setOtp(next)
    inputRefs.current[Math.min(digits.length, 5)]?.focus()
    if (digits.length === 6) setTimeout(() => handleVerifyOTP(digits), 80)
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, #c98a38 0%, transparent 50%), radial-gradient(circle at 75% 75%, #e0c08a 0%, transparent 50%)` }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary-600 opacity-20" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-surface-500 opacity-15" />
        <div className="relative z-10 flex items-center gap-3">
          <SajiinIcon size={32} white />
          <span className="font-display text-xl text-white font-semibold tracking-wide">Sajiin</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
            Semua yang dibutuhkan<br />
            <span className="text-surface-400">bisnis kuliner Anda</span>,<br />
            dalam satu tempat.
          </h1>
          <p className="font-body text-surface-300 text-lg leading-relaxed">
            Kelola produksi, resep, kasir, dan pesanan dari satu dashboard.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2">
          {['Kasir', 'Resep & Food Cost', 'Pre-order', 'Laporan Harian'].map(f => (
            <span key={f} className="px-3 py-1.5 bg-dark-700 text-surface-300 text-sm rounded-lg border border-dark-600">{f}</span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 relative">
        <button onClick={toggleLanguage}
          className="absolute top-6 right-6 px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-200 text-primary-600 text-sm font-medium hover:bg-surface-200 transition-colors">
          {i18n.language === 'id' ? 'EN' : 'ID'}
        </button>

        <div className="lg:hidden flex items-center gap-2 mb-10">
          <SajiinIcon size={36} />
          <span className="font-display text-xl text-dark-800 font-semibold">Sajiin</span>
        </div>

        {/* ── Step 1: Credentials ── */}
        {step === 'credentials' && (
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-dark-800 mb-2 tracking-tight">{t('auth.loginWelcome')}</h2>
              <p className="font-body text-muted-400 text-sm">{t('auth.loginSubtitle')}</p>
            </div>

            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-600 mb-1.5">{t('auth.email')}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')} className="input" autoComplete="email" required />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-muted-600">{t('auth.password')}</label>
                  <button type="button" onClick={() => navigate('/forgot-password')}
                    className="text-xs text-muted-500 hover:text-primary-700 transition-colors">
                    {t('auth.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="input pr-11" autoComplete="current-password" required />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-primary-600 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className={cn('w-full flex items-center justify-center gap-2 btn-primary mt-2', loading && 'opacity-70 cursor-not-allowed')}>
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Mengirim OTP...</span></>
                  : t('auth.loginButton')
                }
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-400">
              Belum punya akun?{' '}
              <button onClick={() => navigate('/register')} className="text-primary-600 font-medium hover:underline">Daftar gratis</button>
            </p>
          </div>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
          <div className="w-full max-w-sm">
            <button onClick={() => { setStep('credentials'); setError(''); setOtp(['','','','','','']) }}
              className="flex items-center gap-1.5 text-sm text-muted-400 hover:text-primary-600 transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>

            <div className="mb-8">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <h2 className="font-display text-2xl font-bold text-dark-800 mb-2">Verifikasi Email</h2>
              <p className="text-sm text-muted-400 leading-relaxed">
                Kode OTP telah dikirim ke<br />
                <span className="font-semibold text-dark-800">{email}</span>
              </p>
            </div>

            {/* OTP boxes */}
            <div className="flex gap-2 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input key={idx}
                  ref={el => { inputRefs.current[idx] = el }}
                  type="text" inputMode="numeric" pattern="\d*"
                  maxLength={1} value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  className={cn(
                    'w-full aspect-square text-center text-2xl font-bold rounded-xl border-2 transition-all focus:outline-none',
                    digit ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-300 bg-white text-dark-800',
                    'focus:border-primary-500 focus:bg-primary-50',
                    error ? 'border-red-300 bg-red-50' : ''
                  )}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
            )}

            <button onClick={() => handleVerifyOTP()} disabled={loading || otp.join('').length < 6}
              className={cn('w-full flex items-center justify-center gap-2 btn-primary', (loading || otp.join('').length < 6) && 'opacity-70 cursor-not-allowed')}>
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Memverifikasi...</span></>
                : 'Verifikasi & Masuk'
              }
            </button>

            <div className="mt-5 text-center">
              {resendCooldown > 0
                ? <p className="text-sm text-muted-400">Kirim ulang dalam <span className="font-semibold text-primary-600">{resendCooldown}d</span></p>
                : <button onClick={handleResend} disabled={loading}
                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium mx-auto transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" /> Kirim ulang OTP
                  </button>
              }
            </div>
            <p className="mt-3 text-center text-xs text-muted-400">Kode berlaku selama <strong>10 menit</strong></p>
          </div>
        )}
      </div>
    </div>
  )
}
