import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Shield, Eye, EyeOff, Loader2, Check, Languages } from 'lucide-react'
import { settingsApi } from '../../services/settingsService'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

export default function SecuritySection() {
  const { i18n } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => settingsApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setError('')
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error ?? 'Gagal mengubah kata sandi')
    },
  })

  const handleSubmit = () => {
    setError('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Semua field wajib diisi')
      return
    }
    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal 6 karakter')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok')
      return
    }
    mutation.mutate()
  }

  const toggleLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  return (
    <div className="space-y-4">
      {/* Language */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-crust-100 rounded-xl flex items-center justify-center">
            <Languages className="w-5 h-5 text-crust-600" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-oven-800">Bahasa Antarmuka</h3>
            <p className="font-body text-xs text-crust-400">Pilih bahasa yang ingin digunakan</p>
          </div>
        </div>

        <div className="flex gap-3">
          {[
            { key: 'id', label: 'Indonesia' },
            { key: 'en', label: 'English' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleLanguage(key)}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-body font-medium border transition-all',
                i18n.language === key
                  ? 'bg-crust-600 text-cream border-crust-600 shadow-warm'
                  : 'bg-dough-50 text-crust-600 border-dough-200 hover:bg-dough-100'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-crust-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-crust-600" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-oven-800">Ubah Kata Sandi</h3>
            <p className="font-body text-xs text-crust-400">Minimal 6 karakter</p>
          </div>
        </div>

        <div className="space-y-3 max-w-sm">
          {/* Current password */}
          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
              Kata Sandi Saat Ini
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-crust-400 hover:text-crust-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-crust-400 hover:text-crust-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(
                'input',
                confirmPassword && confirmPassword !== newPassword && 'border-red-300'
              )}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-red-500 text-xs mt-1 font-body">Kata sandi tidak cocok</p>
            )}
          </div>

          {error && (
            <p className="text-red-600 text-sm font-body bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-xl">
              <Check className="w-4 h-4" />
              <p className="text-sm font-body">Kata sandi berhasil diubah</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="btn-primary flex items-center justify-center gap-2 w-full"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Ubah Kata Sandi
          </button>
        </div>
      </div>
    </div>
  )
}
