import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, CheckCircle, AlertTriangle, Loader2,
  Package, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { productionApi, type ProductionPlanItem } from '../../services/productionService'
import { formatCurrency, cn } from '../../lib/utils'

interface ProductionPlanDetailProps {
  planId: string
  onBack: () => void
}

const WASTE_CATEGORIES = ['expired', 'reject', 'internal']

export default function ProductionPlanDetail({ planId, onBack }: ProductionPlanDetailProps) {
  const qc = useQueryClient()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [editing, setEditing] = useState<Record<string, {
    actualQty: string
    wasteQty: string
    wasteCategory: string
    unsoldQty: string
  }>>({})

  const { data: plan, isLoading } = useQuery({
    queryKey: ['production', planId],
    queryFn: () => productionApi.get(planId),
  })

  const { data: materialCheck } = useQuery({
    queryKey: ['production', planId, 'materials'],
    queryFn: () => productionApi.materialCheck(planId),
    enabled: !!plan,
  })

  const updateMutation = useMutation({
    mutationFn: ({ itemId, data }: {
      itemId: string
      data: { actualQty?: number; wasteQty?: number; wasteCategory?: string; unsoldQty?: number }
    }) => productionApi.updateItem(planId, itemId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production', planId] })
    },
  })

  const initEdit = (item: ProductionPlanItem) => {
    setEditing((prev) => ({
      ...prev,
      [item.id]: {
        actualQty: String(item.actualQty || item.targetQty),
        wasteQty: String(item.wasteQty || 0),
        wasteCategory: item.wasteCategory || 'reject',
        unsoldQty: String(item.unsoldQty || 0),
      },
    }))
    setExpandedItem(item.id)
  }

  const saveItem = (item: ProductionPlanItem) => {
    const draft = editing[item.id]
    if (!draft) return
    updateMutation.mutate({
      itemId: item.id,
      data: {
        actualQty: parseInt(draft.actualQty) || 0,
        wasteQty: parseInt(draft.wasteQty) || 0,
        wasteCategory: draft.wasteCategory,
        unsoldQty: parseInt(draft.unsoldQty) || 0,
      },
    })
    setExpandedItem(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
      </div>
    )
  }

  if (!plan) return null

  const totalTarget = plan.items.reduce((s, i) => s + i.targetQty, 0)
  const totalActual = plan.items.reduce((s, i) => s + i.actualQty, 0)
  const totalWaste = plan.items.reduce((s, i) => s + i.wasteQty + i.unsoldQty, 0)
  const wasteValue = plan.items.reduce((s, i) =>
    s + (i.wasteQty + i.unsoldQty) * i.product.price, 0)

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-body text-crust-500 hover:text-crust-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="h-4 w-px bg-dough-300" />
        <div>
          <p className="font-display text-base font-semibold text-oven-800">
            {new Date(plan.date).toLocaleString('id-ID', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {plan.notes && (
            <p className="font-body text-xs text-crust-400">{plan.notes}</p>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Target', value: `${totalTarget} pcs`, color: 'text-oven-800' },
          { label: 'Aktual', value: `${totalActual} pcs`, color: 'text-green-700' },
          { label: 'Waste / sisa', value: `${totalWaste} pcs`, color: 'text-red-500' },
          { label: 'Nilai waste', value: formatCurrency(wasteValue), color: 'text-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className="font-body text-xs text-crust-400">{label}</p>
            <p className={`font-display text-lg font-semibold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Material check */}
      {materialCheck && !materialCheck.allSufficient && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <p className="font-body text-sm font-medium text-amber-800">Stok bahan tidak mencukupi</p>
          </div>
          <div className="space-y-1">
            {materialCheck.materials
              .filter((m) => !m.sufficient)
              .map((m) => (
                <div key={m.ingredient.id} className="flex justify-between font-body text-xs text-amber-700">
                  <span>{m.ingredient.name}</span>
                  <span>
                    butuh {m.needed.toFixed(1)} {m.ingredient.baseUnit} ·
                    tersedia {m.available} {m.ingredient.baseUnit}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Production items */}
      <div className="space-y-3">
        {plan.items.map((item) => {
          const isExpanded = expandedItem === item.id
          const draft = editing[item.id]
          const isDone = item.actualQty > 0
          const progressPct = item.targetQty > 0
            ? Math.min(100, (item.actualQty / item.targetQty) * 100)
            : 0

          return (
            <div key={item.id} className={cn(
              'card transition-all',
              isDone && 'border-green-200'
            )}>
              {/* Item header */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-dough-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">🥐</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-body text-sm font-semibold text-oven-800">{item.product.name}</p>
                    {isDone && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <span className="font-body text-xs text-crust-500">
                      Target: <span className="font-medium text-oven-700">{item.targetQty} pcs</span>
                    </span>
                    {isDone && (
                      <>
                        <span className="font-body text-xs text-green-600">
                          Aktual: {item.actualQty} pcs
                        </span>
                        {(item.wasteQty > 0 || item.unsoldQty > 0) && (
                          <span className="font-body text-xs text-red-500">
                            Waste: {item.wasteQty + item.unsoldQty} pcs
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {isDone && (
                    <div className="w-full h-1.5 bg-dough-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => isExpanded ? setExpandedItem(null) : initEdit(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body
                             font-medium text-crust-600 hover:bg-dough-100 transition-colors flex-shrink-0"
                >
                  {isDone ? 'Edit' : 'Catat hasil'}
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expanded form */}
              {isExpanded && draft && (
                <div className="mt-4 pt-4 border-t border-dough-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Actual qty */}
                    <div>
                      <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                        Hasil produksi aktual (pcs)
                      </label>
                      <input
                        type="number"
                        value={draft.actualQty}
                        onChange={(e) => setEditing((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], actualQty: e.target.value }
                        }))}
                        min="0"
                        className="input text-sm"
                        autoFocus
                      />
                    </div>

                    {/* Waste qty */}
                    <div>
                      <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                        Jumlah waste / reject (pcs)
                      </label>
                      <input
                        type="number"
                        value={draft.wasteQty}
                        onChange={(e) => setEditing((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], wasteQty: e.target.value }
                        }))}
                        min="0"
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Waste category */}
                    <div>
                      <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                        Kategori waste
                      </label>
                      <div className="flex gap-2">
                        {WASTE_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setEditing((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], wasteCategory: cat }
                            }))}
                            className={cn(
                              'flex-1 py-1.5 rounded-lg text-xs font-body font-medium border transition-all capitalize',
                              draft.wasteCategory === cat
                                ? 'bg-crust-600 text-cream border-crust-600'
                                : 'bg-dough-50 text-crust-600 border-dough-200 hover:bg-dough-100'
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Unsold */}
                    <div>
                      <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
                        Sisa tidak terjual (pcs)
                      </label>
                      <input
                        type="number"
                        value={draft.unsoldQty}
                        onChange={(e) => setEditing((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], unsoldQty: e.target.value }
                        }))}
                        min="0"
                        className="input text-sm"
                      />
                    </div>
                  </div>

                  {/* Waste value preview */}
                  {(parseInt(draft.wasteQty) > 0 || parseInt(draft.unsoldQty) > 0) && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <p className="font-body text-xs text-red-600">
                        Estimasi kerugian:{' '}
                        <span className="font-semibold">
                          {formatCurrency(
                            (parseInt(draft.wasteQty) + parseInt(draft.unsoldQty)) * item.product.price
                          )}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedItem(null)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => saveItem(item)}
                      disabled={updateMutation.isPending}
                      className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                    >
                      {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Simpan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Material needs */}
      {materialCheck && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-crust-500" />
            <p className="font-body text-sm font-medium text-oven-800">Kebutuhan bahan</p>
            {materialCheck.allSufficient && (
              <span className="ml-auto flex items-center gap-1 text-green-600 text-xs font-body">
                <CheckCircle className="w-3.5 h-3.5" />
                Semua stok cukup
              </span>
            )}
          </div>
          <div className="space-y-2">
            {materialCheck.materials.map((m) => (
              <div key={m.ingredient.id} className="flex items-center justify-between">
                <span className="font-body text-sm text-oven-700">{m.ingredient.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-body text-xs text-crust-500">
                    butuh {m.needed.toFixed(1)} {m.ingredient.baseUnit}
                  </span>
                  <span className={cn(
                    'font-body text-xs font-medium',
                    m.sufficient ? 'text-green-600' : 'text-red-500'
                  )}>
                    {m.sufficient ? '✓' : '✗'} {m.available} tersedia
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
