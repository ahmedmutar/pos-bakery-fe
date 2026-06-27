import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Loader2, CheckCircle, Eye, EyeOff, Send } from 'lucide-react'
import api from '../../lib/api'

interface WASettings {
  waPhone: string | null
  waEnabled: boolean
}

function useWASettings() {
  return useQuery<WASettings>({
    queryKey: ['wa-settings'],
    queryFn: () => api.get('/settings/notifications').then(r => r.data),
  })
}

export default function NotificationsSection() {
  const qc = useQueryClient()
  const { data: settings } = useWASettings()

  const [waPhone,    setWaPhone]    = useState('')
  const [waToken,    setWaToken]    = useState('')
  const [waEnabled,  setWaEnabled]  = useState(false)
  const [showToken,  setShowToken]  = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [testMsg,    setTestMsg]    = useState('')

  useEffect(() => {
    if (!settings) return
    setWaPhone(settings.waPhone ?? '')
    setWaEnabled(settings.waEnabled ?? false)
    // waToken tidak dikirim dari server, input tetap kosong kecuali user ubah
  }, [settings])

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/settings/notifications', {
      waPhone:   waPhone.trim() || null,
      ...(waToken.trim() && { waToken: waToken.trim() }),
      waEnabled,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const testMutation = useMutation({
    mutationFn: () => api.post('/settings/notifications/test'),
    onSuccess: (res) => {
      setTestMsg(res.data.message ?? 'Pesan test berhasil dikirim!')
      setTimeout(() => setTestMsg(''), 4000)
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setTestMsg(err?.response?.data?.error ?? 'Gagal mengirim test. Cek token & nomor WA.')
      setTimeout(() => setTestMsg(''), 4000)
    },
  })

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary-600" />
        <h2 className="font-display text-base font-semibold text-dark-800">Notifikasi WhatsApp</h2>
      </div>
      <p className="font-body text-sm text-muted-400">
        Terima notifikasi otomatis via WhatsApp ketika stok bahan baku menipis.
        Menggunakan layanan <a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-primary-600 underline">Fonnte</a> (mulai Rp50rb/bulan).
      </p>

      {/* Enable toggle */}
      <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200">
        <div>
          <p className="font-body text-sm font-medium text-dark-800">Aktifkan Notifikasi WA</p>
          <p className="font-body text-xs text-muted-400 mt-0.5">Notif stok menipis & laporan harian</p>
        </div>
        <button
          onClick={() => setWaEnabled(v => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors ${waEnabled ? 'bg-primary-600' : 'bg-surface-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${waEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      <div className="space-y-4">
        {/* WA Phone */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
            Nomor WhatsApp Owner
          </label>
          <input
            type="tel"
            value={waPhone}
            onChange={e => setWaPhone(e.target.value)}
            placeholder="+6281234567890"
            className="input font-mono"
          />
          <p className="font-body text-xs text-muted-400 mt-1">Format: +62 diikuti nomor (contoh: +6281234567890)</p>
        </div>

        {/* Fonnte Token */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
            Token Fonnte API
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={waToken}
              onChange={e => setWaToken(e.target.value)}
              placeholder="Isi token untuk update, kosongkan jika tidak ingin mengubah"
              className="input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-primary-600"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="font-body text-xs text-muted-400 mt-1">
            Dapatkan token di dashboard Fonnte → Device → Salin token. Token lama tetap aktif jika field dikosongkan.
          </p>
        </div>
      </div>

      {/* Info notifikasi yang dikirim */}
      <div className="bg-surface-50 rounded-xl border border-surface-200 p-3 space-y-1.5">
        <p className="font-body text-xs font-semibold text-dark-700">Notifikasi yang akan dikirim:</p>
        {[
          '⚠️ Stok bahan baku di bawah minimum',
          '📊 Laporan harian (kirim manual dari halaman Laporan)',
        ].map(item => (
          <p key={item} className="font-body text-xs text-muted-500">{item}</p>
        ))}
      </div>

      {/* Feedback test */}
      {testMsg && (
        <div className={`rounded-xl px-3 py-2 font-body text-xs ${testMsg.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {testMsg}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {saveMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved ? <CheckCircle className="w-4 h-4" /> : null
          }
          {saved ? 'Tersimpan!' : 'Simpan'}
        </button>

        <button
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending || !settings?.waPhone}
          className="btn-secondary flex items-center gap-2"
          title={!settings?.waPhone ? 'Simpan nomor WA terlebih dahulu' : ''}
        >
          {testMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
          Test Kirim WA
        </button>
      </div>
    </div>
  )
}
