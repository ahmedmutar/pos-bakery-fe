import { useQueryClient } from '@tanstack/react-query'
import { productApi } from '../../services/productService'
import { categoryApi } from '../../services/categoryService'
import type { ImportRow, ImportResult, ImportColumn } from '../ui/ExcelImportModal'

export const PRODUCT_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'name',     label: 'Nama Produk', required: true,  example: 'Nasi Goreng Spesial' },
  { key: 'price',    label: 'Harga',       required: true,  example: '18000' },
  { key: 'category', label: 'Kategori',    required: false, example: 'Pastry' },
]

export function useProductImport() {
  const qc = useQueryClient()

  const importProducts = async (rows: ImportRow[]): Promise<ImportResult> => {
    let success = 0
    const errors: string[] = []

    // Get or create categories
    const categoryCache: Record<string, string> = {}

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        let categoryId: string | undefined

        const catName = String(row.category ?? '').trim()
        if (catName) {
          if (!categoryCache[catName]) {
            const cats = await categoryApi.list()
            const existing = cats.find((c) => c.name.toLowerCase() === catName.toLowerCase())
            if (existing) {
              categoryCache[catName] = existing.id
            } else {
              const created = await categoryApi.create(catName)
              categoryCache[catName] = created.id
            }
          }
          categoryId = categoryCache[catName]
        }

        await productApi.create({
          name: String(row.name).trim(),
          price: parseInt(String(row.price).replace(/\D/g, '')) || 0,
          categoryId: categoryId ?? undefined,
        })
        success++
      } catch (err) {
        errors.push(`Baris ${i + 2} (${row.name}): ${err instanceof Error ? err.message : 'Error tidak diketahui'}`)
      }
    }

    qc.invalidateQueries({ queryKey: ['products'] })
    qc.invalidateQueries({ queryKey: ['categories'] })
    return { success, failed: rows.length - success, errors }
  }

  return { importProducts }
}
