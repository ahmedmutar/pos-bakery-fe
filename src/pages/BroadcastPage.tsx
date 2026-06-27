import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Eye, Radio, Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { cn } from '../lib/utils'

type TargetType = 'ALL' | 'ACTIVE_30D' | 'ACTIVE_90D' | 'HIGH_VALUE'

interface BroadcastLog {
  id: string
  message: string
  targetType: TargetType
  totalTarget: number
  sentCount: number
  failCount: number
  createdAt: string
}

interface PreviewResult { count: number; targetType: TargetType }

const TARGET_LABELS: Record<TargetType, string> = {
  ALL:         'Semua Pelanggan',
  ACTIVE_30D:  'Aktif 30 Hari',
  ACTIVE_90D:  'Aktif 90 Hari',
  HIGH_VALUE:  'Pelanggan VIP (≥ Rp 1jt)',
}

const TARGET_DESC: Record<TargetType, string> = {
  ALL:         'Kirim ke semua pelanggan terdaftar',
  ACTIVE_30D:  'Pelanggan yang bertransaksi dalam 30 hari terakhir',
  ACTIVE_90D:  'Pelanggan yang bertransaksi dalam 90 hari terakhir',
  HIGH_VALUE:  'Pelanggan dengan total belanja ≥ Rp 1.000.000',
}

export default function BroadcastPage() {
  const qc = useQueryClient()
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<TargetType>('ALL')
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)

  const { data: logs = [], isLoading: logsLoading } = useQuery<BroadcastLog[]>({
    queryKey: ['broadcast-logs'],
    queryFn: async () => (await api.get('/broadcast/logs')).data,
  })

  const sendMutation = useMutation({
    mutationFn: async () => api.post('/broadcast/send', { message, targetType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-logs'] })
      setSendSuccess(true)
      setMessage('')
      setPreview(null)
      setTimeout(() => setSendSuccess(false), 4000)
    },
  })

  async function handlePreview() {
    setPreviewLoading(true)
    try {
      const res = await api.get('/broadcast/preview', { params: { targetType } })
      setPreview({ count: res.data.count, targetType })
    } catch {
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const charCount = message.length
  const isOverLimit = charCount > 1000

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-dark-800 flex items-center gap-2">
          <Radio className="w-6 h-6 text-primary-600" />
          WA Broadcast
        </h1>
        <p className="font-body text-sm text-muted-400 mt-0.5">Kirim pesan promosi ke pelanggan via WhatsApp (Fonnte)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Compose panel */}
        <div className="md:col-span-3 space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="font-body text-sm font-semibold text-dark-800">Tulis Pesan</h2>

            {/* Target selector */}
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-2">Target Penerima</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(TARGET_LABELS) as TargetType[]).map(t => (
                  <button
                    key={t}
                    onClick={() => { setTargetType(t); setPreview(null) }}
                    className={cn(
                      'text-left px-3 py-2.5 rounded-xl border text-xs font-body transition-all',
                      targetType === t
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-surface-200 bg-white text-muted-600 hover:border-primary-300'
                    )}
                  >
                    <p className="font-semibold">{TARGET_LABELS[t]}</p>
                    <p className="text-muted-400 mt-0.5 text-[11px] leading-snug">{TARGET_DESC[t]}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Message textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-body font-medium text-primary-700">Isi Pesan</label>
                <span className={cn('text-xs font-body', isOverLimit ? 'text-red-500' : 'text-muted-400')}>
                  {charCount}/1000
                </span>
              </div>
              <textarea
                rows={6}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className={cn('input resize-none text-sm', isOverLimit && 'border-red-300 focus:ring-red-400')}
                placeholder="Halo {nama}! 🎉 Kami punya promo spesial untuk Anda hari ini..."
              />
              <p className="text-[11px] font-body text-muted-400 mt-1">Gunakan <code className="bg-surface-100 px-1 rounded">{'{nama}'}</code> untuk nama pelanggan</p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                disabled={previewLoading || !message.trim()}
                className="btn-secondary flex items-center gap-2 text-sm flex-1 justify-center"
              >
                {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Preview
              </button>
              <button
                onClick={() => { if (confirm(`Kirim pesan ke ${preview?.count ?? '?'} penerima?`)) sendMutation.mutate() }}
                disabled={sendMutation.isPending || !message.trim() || isOverLimit || !preview}
                className="btn-primary flex items-center gap-2 text-sm flex-1 justify-center disabled:opacity-50"
              >
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Kirim Sekarang
              </button>
            </div>

            {/* Preview result */}
            {preview && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <Eye className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-body text-sm font-semibold text-blue-800">
                    {preview.count} penerima ditemukan
                  </p>
                  <p className="font-body text-xs text-blue-600">Segmen: {TARGET_LABELS[preview.targetType]}</p>
                </div>
              </div>
            )}

            {/* Error */}
            {sendMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="font-body text-sm text-red-600">Gagal mengirim. Cek token Fonnte di pengaturan.</p>
              </div>
            )}

            {/* Success */}
            {sendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="font-body text-sm text-green-700">Broadcast berhasil dikirim!</p>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="card p-4 bg-amber-50 border-amber-200">
            <p className="font-body text-xs font-semibold text-amber-800 mb-2">💡 Tips Pesan yang Efektif</p>
            <ul className="font-body text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Sertakan nama pelanggan dengan <code>{'{nama}'}</code></li>
              <li>Sampaikan manfaat & urgensi (batas waktu promo)</li>
              <li>Tambahkan CTA yang jelas (hubungi, kunjungi, dll)</li>
              <li>Hindari pesan terlalu panjang — fokus &amp; singkat</li>
            </ul>
          </div>
        </div>

        {/* History panel */}
        <div className="md:col-span-2">
          <div className="card p-4">
            <h2 className="font-body text-sm font-semibold text-dark-800 mb-3">Riwayat Broadcast</h2>
            {logsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-muted-400 animate-spin" /></div>
            ) : logs.length === 0 ? (
              <div className="py-8 text-center">
                <Radio className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                <p className="font-body text-xs text-muted-400">Belum ada broadcast</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
                {logs.map(log => (
                  <div key={log.id} className="border border-surface-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-body text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                        {TARGET_LABELS[log.targetType as TargetType] ?? log.targetType}
                      </span>
                      <span className="font-body text-[11px] text-muted-400 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="font-body text-xs text-dark-700 line-clamp-2">{log.message}</p>
                    <div className="flex items-center gap-3 text-[11px] font-body">
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {log.sentCount} terkirim
                      </span>
                      {log.failCount > 0 && (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {log.failCount} gagal
                        </span>
                      )}
                      <span className="text-muted-400">/ {log.totalTarget} total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
