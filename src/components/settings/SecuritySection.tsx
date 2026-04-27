import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Shield, Eye, EyeOff, Loader2, Check, Mail } from 'lucide-react'
import { settingsApi } from '../../services/settingsService'
import { useAuthStore } from '../../stores/authStore'
import api from '../../lib/api'
import { cn } from '../../lib/utils'

type Step = 'form' | 'otp' | 'done'

export default function SecuritySection() {
  const { user } = useAuthStore()
  const [step, setStep]               = useState<Step>('form')
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNew]         = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [otp, setOtp]                 = useState(['', '', '', '', '', ''])
  const [error, setError]             = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Step 1 — send OTP to email
  const sendOtpMutation = useMutation({
    mutationFn: () => api.post('/auth/send-otp', { email: user?.email, name: user?.name ?? 'User' }),
    onSuccess: () => {
      setStep('otp')
      setError('')
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    },
    onError: () => setError('Gagal mengirim OTP. Coba lagi.'),
  })

  // Step 2 — change password with OTP
  const changeMutation = useMutation({
    mutationFn: () => settingsApi.changePassword(currentPassword, newPassword, otp.join('')),
    onSuccess: () => {
      setStep('done')
      setCurrent('')
      setNew('')
      setConfirm('')
      setOtp(['', '', '', '', '', ''])
      setError('')
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error ?? 'Gagal mengubah kata sandi')
    },
  })

  const handleSubmitForm = () => {
    setError('')
    if (!currentPassword || !newPassword || !confirmPassword) return setError('Semua field wajib diisi')
    if (newPassword.length < 6) return setError('Kata sandi baru minimal 6 karakter')
    if (newPassword !== confirmPassword) return setError('Konfirmasi kata sandi tidak cocok')
    sendOtpMutation.mutate()
  }

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    if (next.every(d => d)) {
      setTimeout(() => changeMutation.mutate(), 100)
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
      setTimeout(() => changeMutation.mutate(), 100)
    }
    e.preventDefault()
  }

  return (
    <div className="card space-y-5 max-w-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-crust-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-crust-600" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-oven-800">Ubah Kata Sandi</h3>
          <p className="font-body text-xs text-crust-400">Verifikasi via OTP ke email Anda</p>
        </div>
      </div>

      {/* ── DONE ── */}
      {step === 'done' && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl">
          <Check className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-body text-sm font-semibold">Kata sandi berhasil diubah</p>
            <button onClick={() => setStep('form')} className="font-body text-xs text-green-600 underline mt-0.5">
              Ubah lagi
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 1: Form ── */}
      {step === 'form' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">Kata Sandi Saat Ini</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
                className="input pr-10"
                autoFocus
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-crust-400">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">Kata Sandi Baru</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNew(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="input pr-10"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-crust-400">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">Konfirmasi Kata Sandi Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={cn('input', confirmPassword && confirmPassword !== newPassword && 'border-red-300')}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitForm() }}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-red-500 text-xs mt-1 font-body">Kata sandi tidak cocok</p>
            )}
          </div>

          {error && <p className="text-red-600 text-sm font-body bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <button
            onClick={handleSubmitForm}
            disabled={sendOtpMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sendOtpMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Mail className="w-4 h-4" />}
            {sendOtpMutation.isPending ? 'Mengirim OTP...' : 'Lanjut — Verifikasi OTP'}
          </button>
        </div>
      )}

      {/* ── STEP 2: OTP ── */}
      {step === 'otp' && (
        <div className="space-y-4">
          <div className="bg-dough-50 rounded-xl px-4 py-3 flex items-start gap-3">
            <Mail className="w-4 h-4 text-crust-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-oven-800">Cek email Anda</p>
              <p className="font-body text-xs text-crust-400 mt-0.5">
                Kode OTP 6 digit dikirim ke <strong>{user?.email}</strong>. Berlaku 10 menit.
              </p>
            </div>
          </div>

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
                    'w-10 h-11 text-center font-mono text-xl font-bold border-2 rounded-xl',
                    'focus:outline-none focus:ring-2 focus:ring-crust-400 transition-all',
                    digit ? 'border-crust-500 bg-dough-50' : 'border-dough-300 bg-white',
                    error && 'border-red-400'
                  )}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm font-body bg-red-50 px-3 py-2 rounded-xl text-center">{error}</p>}

          {changeMutation.isPending && (
            <div className="flex items-center justify-center gap-2 text-crust-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-body text-sm">Mengubah kata sandi...</span>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setStep('form'); setError(''); setOtp(['','','','','','']) }}
              className="btn-secondary flex-1 text-sm">
              Kembali
            </button>
            <button
              onClick={() => sendOtpMutation.mutate()}
              disabled={sendOtpMutation.isPending}
              className="flex-1 text-sm font-body text-crust-500 hover:text-crust-700 transition-colors"
            >
              Kirim ulang OTP
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
