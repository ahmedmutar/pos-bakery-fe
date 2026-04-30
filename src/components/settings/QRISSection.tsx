import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QrCode, Upload, Trash2, Loader2, CheckCircle } from 'lucide-react'
import api from '../../lib/api'

interface QRISData {
  qrisImageUrl: string | null
}

const qrisApi = {
  get: async (): Promise<QRISData> => (await api.get('/settings/qris')).data,
  upload: async (imageBase64: string): Promise<QRISData> =>
    (await api.post('/settings/qris', { imageBase64 })).data,
  delete: async (): Promise<void> => api.delete('/settings/qris'),
}

export default function QRISSection() {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState(false)

  const { data } = useQuery({ queryKey: ['qris-info'], queryFn: qrisApi.get })

  const uploadMutation = useMutation({
    mutationFn: qrisApi.upload,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qris-info'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: qrisApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['qris-info'] }),
  })

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      uploadMutation.mutate(base64)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <QrCode className="w-5 h-5 text-primary-600" />
        <h2 className="font-display text-base font-semibold text-dark-800">QR Code QRIS</h2>
      </div>
      <p className="font-body text-sm text-muted-400">
        Upload foto QR code QRIS toko Anda. Akan ditampilkan ke pelanggan saat memilih metode QRIS di kasir.
      </p>

      {data?.qrisImageUrl ? (
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={data.qrisImageUrl}
                alt="QR Code QRIS"
                className="w-48 h-48 object-contain border-2 border-surface-200 rounded-2xl p-2 bg-white"
              />
              {saved && (
                <div className="absolute inset-0 bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {uploadMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Upload className="w-4 h-4" />
              }
              Ganti QR Code
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="btn-ghost flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-surface-300 rounded-2xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-surface-50 transition-all"
        >
          {uploadMutation.isPending ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-muted-400 animate-spin" />
              <p className="font-body text-sm text-muted-400">Menyimpan...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <QrCode className="w-10 h-10 text-surface-300" />
              <p className="font-body text-sm font-medium text-primary-600">Upload QR Code QRIS</p>
              <p className="font-body text-xs text-muted-400">PNG, JPG, atau JPEG · Maks 500KB</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
        <p className="font-body text-xs text-muted-500">
          <strong>Tips:</strong> Pastikan QR code jelas dan tidak terpotong. Ambil foto langsung dari stiker QRIS atau screenshot dari aplikasi bank Anda.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
