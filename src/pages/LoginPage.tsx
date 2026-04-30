import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../services/authService'
import { SajiinIcon } from '../components/ui/SajiinLogo'
import { cn } from '../lib/utils'

export default function LoginPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.login({ email, password })
      login(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenantName,
        },
        token
      )
      navigate('/app/dashboard')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Terjadi kesalahan. Coba lagi.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const toggleLanguage = () => {
    const next = i18n.language === 'id' ? 'en' : 'id'
    i18n.changeLanguage(next)
    localStorage.setItem('language', next)
  }

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-800 relative overflow-hidden flex-col justify-between p-12">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #c98a38 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #e0c08a 0%, transparent 50%)`,
          }}
        />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary-600 opacity-20" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-surface-500 opacity-15" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-500 rounded-xl flex items-center justify-center shadow-warm">
            <SajiinIcon size={28} />
          </div>
          <span className="font-display text-xl text-white font-semibold tracking-wide">
            {t('app.name')}
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
            Semua yang dibutuhkan<br />
            <span className="text-surface-400">bisnis kuliner Anda</span>,<br />
            dalam satu tempat.
          </h1>
          <p className="font-body text-surface-300 text-lg leading-relaxed">
            Kelola produksi, resep, kasir, dan pesanan kustom dari satu dasbor.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-2">
          {['Kasir', 'Resep & Food Cost', 'Pre-order', 'Laporan Harian'].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 bg-dark-700 text-surface-300 text-sm font-body rounded-lg border border-dark-600"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8 relative">
        <button
          onClick={toggleLanguage}
          className="absolute top-6 right-6 px-3 py-1.5 rounded-lg bg-surface-100 border border-surface-200
                     text-primary-600 text-sm font-body font-medium hover:bg-surface-200 transition-colors"
        >
          {i18n.language === 'id' ? 'EN' : 'ID'}
        </button>

        <div className="lg:hidden flex items-center gap-2 mb-10">
          <SajiinIcon size={36} />
          <span className="font-display text-xl text-dark-800 font-semibold">{t('app.name')}</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-dark-800 mb-2 tracking-tight">{t('auth.loginWelcome')}</h2>
            <p className="font-body text-muted-400 text-sm">{t('auth.loginSubtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-body font-medium text-primary-700 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="input"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-body font-medium text-primary-700">
                  {t('auth.password')}
                </label>
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-muted-500 hover:text-primary-700 font-body transition-colors">
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="input pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-primary-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-body px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full flex items-center justify-center gap-2 mt-2',
                'bg-primary-600 hover:bg-primary-700 text-white font-body font-medium',
                'px-5 py-2.5 rounded-xl transition-all duration-200 shadow-warm',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                t('auth.loginButton')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
