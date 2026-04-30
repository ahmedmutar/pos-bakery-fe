import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import PasswordInput, { validatePassword } from '../components/ui/PasswordInput'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/reset-password', { token, newPassword: password })
      return res.data
    },
    onSuccess: () => setDone(true),
  })

  const pwMatch = password === confirm
  const pwValid = !validatePassword(password)
  const canSubmit = pwValid && pwMatch && !!token

  if (!token) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <h1 className="font-display text-xl font-bold text-dark-800">Link Tidak Valid</h1>
          <p className="font-body text-sm text-muted-400">Token reset tidak ditemukan. Minta link reset baru.</p>
          <button onClick={() => navigate('/forgot-password')} className="btn-primary w-full">
            Minta Link Baru
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="font-display text-xl font-bold text-dark-800">Password Berhasil Direset</h1>
          <p className="font-body text-sm text-muted-500">Silakan login dengan password baru Anda.</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">
            Login Sekarang
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm p-8 space-y-6">
        <div>
          <div className="w-12 h-12 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-dark-800">Reset Password</h1>
          <p className="font-body text-sm text-muted-400 mt-1">Buat password baru untuk akun Anda.</p>
        </div>

        <div className="space-y-4">
          <PasswordInput
            value={password}
            onChange={setPassword}
            label="Password Baru"
            placeholder="Min 8 karakter, huruf besar, angka, simbol"
            showRules={true}
            autoFocus
          />

          <div>
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              label="Konfirmasi Password"
              placeholder="Ulangi password baru"
              showRules={false}
            />
            {confirm && !pwMatch && (
              <p className="font-body text-xs text-red-500 mt-1">Password tidak cocok</p>
            )}
          </div>

                    {mutation.isError && (
            <p className="font-body text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
              Token tidak valid atau sudah kadaluarsa. Minta link reset baru.
            </p>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Simpan Password Baru
          </button>

          <button
            onClick={() => navigate('/forgot-password')}
            className="w-full text-center font-body text-xs text-muted-400 hover:text-primary-600 transition-colors"
          >
            Minta link reset baru
          </button>
        </div>
      </div>
    </div>
  )
}
