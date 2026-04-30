import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Loader2 } from 'lucide-react'
import { inventoryApi, type Ingredient, type IngredientType } from '../../services/inventoryService'
import { cn } from '../../lib/utils'

interface IngredientFormModalProps {
  ingredient?: Ingredient
  onClose: () => void
}

const COMMON_UNITS = ['gram', 'kg', 'ml', 'liter', 'butir', 'buah', 'lembar', 'sachet', 'kaleng', 'unit', 'set', 'pack', 'roll', 'box']

const TYPE_OPTIONS: { key: IngredientType; label: string }[] = [
  { key: 'INGREDIENT', label: 'Bahan Baku' },
  { key: 'EQUIPMENT',  label: 'Alat' },
  { key: 'PACKAGING',  label: 'Kemasan' },
]

export default function IngredientFormModal({ ingredient, onClose }: IngredientFormModalProps) {
  const qc = useQueryClient()
  const isEdit = !!ingredient

  const [name, setName] = useState(ingredient?.name ?? '')
  const [type, setType] = useState<IngredientType>(ingredient?.type ?? 'INGREDIENT')
  const [baseUnit, setBaseUnit] = useState(ingredient?.baseUnit ?? 'gram')
  const [customUnit, setCustomUnit] = useState('')
  const [minimumStock, setMinimumStock] = useState(String(ingredient?.minimumStock ?? ''))
  const [currentPrice, setCurrentPrice] = useState(String(ingredient?.currentPrice ?? ''))
  const [notes, setNotes] = useState(ingredient?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isCustomUnit = !COMMON_UNITS.includes(baseUnit)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Nama wajib diisi'
    if (!baseUnit.trim()) errs.baseUnit = 'Satuan wajib diisi'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const mutation = useMutation({
    mutationFn: () => {
      const unit = isCustomUnit ? customUnit.trim() : baseUnit
      const payload = {
        name: name.trim(),
        type,
        baseUnit: unit,
        minimumStock: parseFloat(minimumStock) || 0,
        currentPrice: parseInt(currentPrice.replace(/\D/g, '')) || 0,
        currentStock: ingredient?.currentStock ?? 0,
        notes: notes.trim() || undefined,
      }
      return isEdit
        ? inventoryApi.updateIngredient(ingredient.id, payload)
        : inventoryApi.createIngredient(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      onClose()
    },
  })

  const handleSubmit = () => {
    if (validate()) mutation.mutate()
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <h2 className="font-display text-base font-semibold text-dark-800">
            {isEdit ? 'Edit Item' : 'Tambah Item Inventaris'}
          </h2>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-2">Tipe</label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl text-sm font-body font-medium border transition-all',
                    type === key
                      ? 'bg-primary-600 text-white border-primary-600 shadow-warm'
                      : 'bg-white text-primary-600 border-surface-200 hover:bg-surface-50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
              Nama {type === 'INGREDIENT' ? 'Bahan' : type === 'EQUIPMENT' ? 'Alat' : 'Kemasan'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === 'INGREDIENT' ? 'Tepung Protein Tinggi' :
                type === 'EQUIPMENT' ? 'Mixer Stand' :
                'Kantong Plastik'
              }
              className={cn('input', errors.name && 'border-red-400')}
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">Satuan</label>
            <select
              value={isCustomUnit ? '__custom__' : baseUnit}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setBaseUnit('__custom__')
                } else {
                  setBaseUnit(e.target.value)
                }
              }}
              className={cn('input', errors.baseUnit && 'border-red-400')}
            >
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
              <option value="__custom__">Lainnya...</option>
            </select>
            {(isCustomUnit || baseUnit === '__custom__') && (
              <input
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="Masukkan satuan"
                className="input mt-2"
                autoFocus
              />
            )}
            {errors.baseUnit && <p className="text-red-500 text-xs mt-1">{errors.baseUnit}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Minimum Stock */}
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
                Stok Minimum
              </label>
              <input
                type="number"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                placeholder="0"
                className="input font-mono"
                min={0}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
                Harga per Satuan (Rp)
              </label>
              <input
                type="text"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="input font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
              Catatan (opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type === 'INGREDIENT' ? 'Merek, grade, supplier...' :
                type === 'EQUIPMENT' ? 'Model, kapasitas, kondisi...' :
                'Ukuran, warna, merek...'
              }
              className="input"
            />
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm font-body">Gagal menyimpan. Coba lagi.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Tambah Item'}
          </button>
        </div>
      </div>
    </div>
  )
}
