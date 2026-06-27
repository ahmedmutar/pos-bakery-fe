import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Loader2, Check, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/utils'

interface LoyaltySettings {
  loyaltyEnabled: boolean
  pointsPerRupiah: number
  pointsRedeemValue: number
}

export default function LoyaltySection() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<LoyaltySettings>({
    queryKey: ['loyalty-settings'],
    queryFn: async () => (await api.get('/settings/loyalty')).data,
  })

  const [enabled, setEnabled] = useState(false)
  const [pointsPerRupiah, setPointsPerRupiah] = useState('1')
  const [pointsRedeemValue, setPointsRedeemValue] = useState('100')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) {
      setEnabled(data.loyaltyEnabled)
      setPointsPerRupiah(String(data.pointsPerRupiah))
      setPointsRedeemValue(String(data.pointsRedeemValue))
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: async () => api.patch('/settings/loyalty', {
      loyaltyEnabled: enabled,
      pointsPerRupiah: parseInt(pointsPerRupiah) || 1,
      pointsRedeemValue: parseInt(pointsRedeemValue) || 100,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-muted-400 animate-spin" />
      </div>
    )
  }

  // Preview: at Rp 50.000 purchase, how many points?
  const examplePurchase = 50_000
  const perRupiah = parseInt(pointsPerRupiah) || 1
  const redeemVal = parseInt(pointsRedeemValue) || 100
  const examplePoints = Math.floor(examplePurchase / (perRupiah * 1000))
  const exampleRedeemRp = 100 * redeemVal

  return (
    <div className="card p-6 space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-dark-800">Program Loyalitas</h2>
          <p className="font-body text-xs text-muted-400">Kumpul poin & tukar diskon untuk pelanggan setia</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between py-3 border-b border-surface-100">
        <div>
          <p className="font-body text-sm font-semibold text-dark-800">Aktifkan Loyalty Program</p>
          <p className="font-body text-xs text-muted-400 mt-0.5">Pelanggan mendapat poin di setiap transaksi</p>
        </div>
        <button onClick={() => setEnabled(!enabled)} className="flex-shrink-0">
          {enabled
            ? <ToggleRight className="w-10 h-10 text-primary-600" />
            : <ToggleLeft className="w-10 h-10 text-muted-300" />
          }
        </button>
      </div>

      {/* Settings — only visible when enabled */}
      {enabled && (
        <div className="space-y-5">
          {/* Points per Rp 1.000 */}
          <div>
            <label className="block text-xs font-body font-semibold text-primary-700 mb-1">
              Poin per Rp 1.000 belanja
            </label>
            <p className="font-body text-xs text-muted-400 mb-2">
              Pelanggan mendapat N poin untuk setiap Rp 1.000 transaksi
            </p>
            <input
              type="number"
              min={1}
              max={100}
              value={pointsPerRupiah}
              onChange={(e) => setPointsPerRupiah(e.target.value)}
              className="input w-32 text-sm"
            />
          </div>

          {/* Points redeem value */}
          <div>
            <label className="block text-xs font-body font-semibold text-primary-700 mb-1">
              Nilai tukar per poin
            </label>
            <p className="font-body text-xs text-muted-400 mb-2">
              1 poin = Rp berapa saat ditukar jadi diskon
            </p>
            <div className="flex items-center gap-2">
              <span className="font-body text-sm text-muted-400">Rp</span>
              <input
                type="number"
                min={1}
                value={pointsRedeemValue}
                onChange={(e) => setPointsRedeemValue(e.target.value)}
                className="input w-32 text-sm"
              />
              <span className="font-body text-sm text-muted-400">/ poin</span>
            </div>
          </div>

          {/* Preview box */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1.5">
            <p className="font-body text-xs font-semibold text-amber-800">Contoh perhitungan:</p>
            <p className="font-body text-xs text-amber-700">
              Belanja {formatCurrency(examplePurchase)} → mendapat <strong>{examplePoints} poin</strong>
            </p>
            <p className="font-body text-xs text-amber-700">
              100 poin = <strong>diskon {formatCurrency(exampleRedeemRp)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {updateMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved
            ? <><Check className="w-4 h-4" /> Tersimpan!</>
            : 'Simpan Pengaturan'
          }
        </button>
        {saved && !updateMutation.isPending && (
          <span className="font-body text-sm text-green-600 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Perubahan disimpan
          </span>
        )}
      </div>
    </div>
  )
}
