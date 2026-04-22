import { useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../../services/inventoryService'
import type { ImportRow, ImportResult, ImportColumn } from '../ui/ExcelImportModal'

export const INVENTORY_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'name',         label: 'Nama',            required: true,  example: 'Tepung Protein Tinggi' },
  { key: 'type',         label: 'Tipe',             required: false, example: 'INGREDIENT' },
  { key: 'baseUnit',     label: 'Satuan',           required: true,  example: 'gram' },
  { key: 'currentStock', label: 'Stok Awal',        required: false, example: '5000' },
  { key: 'minimumStock', label: 'Stok Minimum',     required: false, example: '1000' },
  { key: 'currentPrice', label: 'Harga per Satuan', required: false, example: '14' },
  { key: 'notes',        label: 'Catatan',          required: false, example: 'Merek Segitiga Biru' },
]

const VALID_TYPES = ['INGREDIENT', 'EQUIPMENT', 'PACKAGING']

export function useInventoryImport() {
  const qc = useQueryClient()

  const importIngredients = async (rows: ImportRow[]): Promise<ImportResult> => {
    let success = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const rawType = String(row.type ?? '').toUpperCase().trim()
        const type = VALID_TYPES.includes(rawType)
          ? rawType as 'INGREDIENT' | 'EQUIPMENT' | 'PACKAGING'
          : 'INGREDIENT'

        await inventoryApi.createIngredient({
          name: String(row.name).trim(),
          type,
          baseUnit: String(row.baseUnit).trim(),
          currentStock: parseFloat(String(row.currentStock ?? 0)) || 0,
          minimumStock: parseFloat(String(row.minimumStock ?? 0)) || 0,
          currentPrice: parseInt(String(row.currentPrice ?? 0).replace(/\D/g, '')) || 0,
          notes: row.notes ? String(row.notes).trim() : undefined,
        })
        success++
      } catch (err) {
        errors.push(`Baris ${i + 2} (${row.name}): ${err instanceof Error ? err.message : 'Error tidak diketahui'}`)
      }
    }

    qc.invalidateQueries({ queryKey: ['ingredients'] })
    return { success, failed: rows.length - success, errors }
  }

  return { importIngredients }
}
