import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Croissant, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { authApi } from '../services/authService'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../lib/utils'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const [tenantName, setTenantName] = useState('')
  const [slug, setSlug] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate slug from tenant name
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

  const mutation = useMutation({
    mutationFn: () => authApi.register({ tenantName, slug, ownerName, email, password }),
    onSuccess: (data) => {
      login(data.user, data.token)
      navigate('/app/dashboard')
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      const msg = err.response?.data?.error ?? 'Pendaftaran gagal. Coba lagi.'
      setErrors({ general: msg })
    },
  })

  const handleSubmit = () => {
    if (validate()) mutation.mutate()
  }

  return (
    <div className="min-h-screen bg-crust-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-oven-800 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crust-600 rounded-xl flex items-center justify-center">
            <Croissant className="w-4 h-4 text-cream" />
          </div>
          <span className="font-display text-lg font-bold text-cream">Roti POS</span>
        </div>

        <div>
          <h2 className="font-display text-4xl font-bold text-cream leading-tight mb-4 tracking-tight">
            Mulai kelola bakery<br />dengan lebih cerdas
          </h2>
          <ul className="space-y-3">
            {[
              'Kasir offline-ready',
              'Laporan real-time',
              'Manajemen resep & food cost',
              'Forecast produksi berbasis data',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 font-body text-crust-200 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-crust-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="font-body text-xs text-crust-500">
          © {new Date().getFullYear()} Roti POS
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8">
        <div className="w-full max-w-md space-y-6">
          <div>
            <Link to="/" className="flex items-center gap-1.5 text-sm font-body text-crust-400 hover:text-crust-600 transition-colors mb-6">
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali
            </Link>
            <h1 className="font-display text-3xl font-bold text-oven-800 tracking-tight">
              Daftar Gratis
            </h1>
            <p className="font-body text-crust-400 text-sm mt-1">
              Trial 14 hari, tidak perlu kartu kredit
            </p>
          </div>

          <div className="space-y-4">
            {/* Tenant name */}
            <div>
              <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                Nama Toko / Bakery
              </label>
              <input
                type="text"
                value={tenantName}
                onChange={(e) => handleTenantName(e.target.value)}
                placeholder="Bakery Sejahtera"
                className={cn('input', errors.tenantName && 'border-red-400')}
                autoFocus
              />
              {errors.tenantName && <p className="text-red-500 text-xs mt-1">{errors.tenantName}</p>}
              {slug && (
                <p className="font-mono text-xs text-crust-400 mt-1">
                  URL: rotipos.com/<span className="text-crust-600">{slug}</span>
                </p>
              )}
            </div>

            {/* Owner name */}
            <div>
              <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                Nama Anda (Pemilik)
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Budi Santoso"
                className={cn('input', errors.ownerName && 'border-red-400')}
              />
              {errors.ownerName && <p className="text-red-500 text-xs mt-1">{errors.ownerName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="budi@bakery.com"
                className={cn('input', errors.email && 'border-red-400')}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className={cn('input pr-10', errors.password && 'border-red-400')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-crust-400 hover:text-crust-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm font-body">{errors.general}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Buat Akun Gratis
            </button>

            <p className="font-body text-xs text-crust-400 text-center">
              Dengan mendaftar, Anda menyetujui{' '}
              <a href="#" className="underline text-crust-600">Syarat & Ketentuan</a>{' '}
              dan{' '}
              <a href="#" className="underline text-crust-600">Kebijakan Privasi</a> kami.
            </p>
          </div>

          <p className="font-body text-sm text-crust-500 text-center">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-crust-700 font-medium underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
