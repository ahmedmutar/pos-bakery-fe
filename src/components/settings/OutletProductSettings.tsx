import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save, RotateCcw, PackageX, Check } from 'lucide-react'
import { outletProductApi, type OutletProductConfig } from '../../services/outletProductService'
import { formatCurrency, cn } from '../../lib/utils'

interface OutletProductSettingsProps {
  outletId: string
  outletName: string
}

interface LocalConfig {
  isAvailable: boolean
  priceOverride: string
  stock: string
}

export default function OutletProductSettings({ outletId, outletName }: OutletProductSettingsProps) {
  const qc = useQueryClient()
  const [localConfigs, setLocalConfigs] = useState<Record<string, LocalConfig>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['outlet-products', outletId],
    queryFn: () => outletProductApi.list(outletId),
  })

  useEffect(() => {
    if (products.length === 0) return
    const initial: Record<string, LocalConfig> = {}
    products.forEach((p) => {
      initial[p.productId] = {
        isAvailable: p.isAvailable,
        priceOverride: p.priceOverride ? String(p.priceOverride) : '',
        stock: p.stock !== null ? String(p.stock) : '',
      }
    })
    setLocalConfigs(initial)
    setIsDirty(false)
  }, [products])

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = products.map((p) => {
        const cfg = localConfigs[p.productId]
        return {
          productId: p.productId,
          isAvailable: cfg?.isAvailable ?? true,
          priceOverride: cfg?.priceOverride ? parseInt(cfg.priceOverride) || 0 : null,
          stock: cfg?.stock !== '' && cfg?.stock !== undefined ? parseInt(cfg.stock) || 0 : null,
        }
      })
      return outletProductApi.bulkUpdate(outletId, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['outlet-products', outletId] })
      setIsDirty(false)
      setSavedAt(new Date())
    },
  })

  const updateConfig = (productId: string, field: keyof LocalConfig, value: string | boolean) => {
    setLocalConfigs((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }))
    setIsDirty(true)
    setSavedAt(null)
  }

  const resetAll = () => {
    const reset: Record<string, LocalConfig> = {}
    products.forEach((p) => {
      reset[p.productId] = { isAvailable: true, priceOverride: '', stock: '' }
    })
    setLocalConfigs(reset)
    setIsDirty(true)
  }

  const grouped = products.reduce((acc, p) => {
    const cat = p.category?.name ?? 'Tanpa Kategori'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {} as Record<string, OutletProductConfig[]>)

  const availableCount = Object.values(localConfigs).filter((c) => c.isAvailable).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-muted-400 animate-spin" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 text-surface-300">
        <PackageX className="w-8 h-8" />
        <p className="font-body text-sm">Belum ada produk. Tambah produk terlebih dahulu.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-sm font-medium text-dark-800">{outletName}</p>
          <p className="font-body text-xs text-muted-400">
            {availableCount} dari {products.length} produk tersedia
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && (
            <span className="flex items-center gap-1 font-body text-xs text-green-600">
              <Check className="w-3 h-3" />Tersimpan
            </span>
          )}
          <button onClick={resetAll} className="btn-ghost text-sm flex items-center gap-1.5 py-1.5">
            <RotateCcw className="w-3.5 h-3.5" />Reset semua
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending}
            className="btn-primary text-sm flex items-center gap-1.5 py-1.5 px-4 disabled:opacity-50"
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan
          </button>
        </div>
      </div>

      <div className="bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
        <p className="font-body text-xs text-muted-500">
          Kosongkan harga untuk pakai harga default. Kosongkan stok jika tidak tracking stok per outlet.
          Produk nonaktif tidak muncul di kasir outlet ini.
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              <th className="text-left px-5 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Produk</th>
              <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest">Harga Default</th>
              <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest w-36">Override Harga</th>
              <th className="text-right px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest w-28">Stok</th>
              <th className="text-center px-4 py-3 font-body text-[10px] font-semibold text-muted-500 uppercase tracking-widest w-24">Tersedia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {Object.entries(grouped).map(([cat, items]) => (
              <>
                <tr key={`cat-${cat}`} className="bg-surface-50/50">
                  <td colSpan={5} className="px-5 py-2 font-body text-[10px] uppercase tracking-widest text-muted-400 font-semibold">
                    {cat}
                  </td>
                </tr>
                {items.map((p) => {
                  const cfg = localConfigs[p.productId]
                  const isAvailable = cfg?.isAvailable ?? true
                  return (
                    <tr key={p.productId} className={cn('transition-colors', isAvailable ? 'hover:bg-surface-50' : 'opacity-50 bg-surface-50')}>
                      <td className="px-5 py-3">
                        <p className="font-body text-sm font-semibold text-dark-800">{p.name}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm text-muted-500">{formatCurrency(p.defaultPrice)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-xs text-muted-400">Rp</span>
                          <input
                            type="number"
                            value={cfg?.priceOverride ?? ''}
                            onChange={(e) => updateConfig(p.productId, 'priceOverride', e.target.value)}
                            placeholder={String(p.defaultPrice)}
                            className="input pl-8 py-1.5 text-right font-mono text-sm"
                            min={0}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={cfg?.stock ?? ''}
                          onChange={(e) => updateConfig(p.productId, 'stock', e.target.value)}
                          placeholder="—"
                          className="input py-1.5 text-right font-mono text-sm"
                          min={0}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => updateConfig(p.productId, 'isAvailable', !isAvailable)}
                          className={cn('w-10 h-6 rounded-full transition-all relative', isAvailable ? 'bg-primary-600' : 'bg-surface-200')}
                        >
                          <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all', isAvailable ? 'left-5' : 'left-1')} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
