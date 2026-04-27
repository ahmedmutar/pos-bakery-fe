import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { QrCode, AlertCircle, Check, FileText } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import api from '../../lib/api'

interface QRISDisplayProps {
  amount: number
  onConfirm: (proof: string) => void
}

export default function QRISDisplay({ amount, onConfirm }: QRISDisplayProps) {
  const [proof, setProof] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['qris-info'],
    queryFn: async () => (await api.get('/settings/qris')).data as { qrisImageUrl: string | null },
  })

  if (isLoading) {
    return <div className="py-8 text-center font-body text-sm text-crust-400">Memuat QR code...</div>
  }

  return (
    <div className="space-y-4">
      {!data?.qrisImageUrl ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-amber-700">QR Code belum diatur</p>
            <p className="font-body text-xs text-amber-600 mt-0.5">
              Minta Owner upload QR Code QRIS di Pengaturan → QRIS.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-body font-semibold text-crust-600 uppercase tracking-widest">
              <QrCode className="w-3.5 h-3.5" />
              Scan QR Code untuk Bayar
            </div>
            <div className="border-4 border-oven-800 rounded-2xl p-2 bg-white">
              <img
                src={data.qrisImageUrl}
                alt="QR Code QRIS"
                className="w-52 h-52 object-contain"
              />
            </div>
            <div className="text-center">
              <p className="font-body text-xs text-crust-400">Total yang harus dibayar</p>
              <p className="font-display text-xl font-bold text-oven-800">{formatCurrency(amount)}</p>
            </div>
          </div>
          <div className="bg-dough-50 border border-dough-200 rounded-xl px-4 py-2.5 text-center">
            <p className="font-body text-xs text-crust-500">
              Arahkan kamera ke QR code · Nominal akan muncul otomatis
            </p>
          </div>
        </div>
      )}

      {/* Bukti pembayaran */}
      <div>
        <label className="block text-xs font-body font-medium text-crust-700 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Nomor Referensi
          <span className="text-crust-400 font-normal">(opsional)</span>
        </label>
        <input
          type="text"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          placeholder="Nomor referensi dari notifikasi QRIS"
          className="input text-sm"
        />
        <p className="font-body text-xs text-crust-400 mt-1">
          Isi jika ada, untuk rekonsiliasi pembayaran
        </p>
      </div>

      <button
        onClick={() => onConfirm(proof)}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        Konfirmasi Pembayaran Diterima
      </button>
    </div>
  )
}
