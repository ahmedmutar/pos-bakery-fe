import { useQueryClient } from '@tanstack/react-query'
import { recipeApi } from '../../services/recipeService'
import { inventoryApi } from '../../services/inventoryService'
import type { ImportRow, ImportResult, ImportColumn } from '../ui/ExcelImportModal'

export const RECIPE_IMPORT_COLUMNS: ImportColumn[] = [
  { key: 'productName',    label: 'Nama Produk',    required: true,  example: 'Nasi Goreng Spesial' },
  { key: 'ingredientName', label: 'Nama Bahan',     required: true,  example: 'Tepung Protein Tinggi' },
  { key: 'amount',         label: 'Jumlah',         required: true,  example: '500' },
  { key: 'unit',           label: 'Satuan',         required: true,  example: 'gram' },
  { key: 'batchSize',      label: 'Ukuran Batch',   required: false, example: '12' },
]

export function useRecipeImport() {
  const qc = useQueryClient()

  const importRecipes = async (rows: ImportRow[]): Promise<ImportResult> => {
    let success = 0
    const errors: string[] = []

    // Get all products and ingredients first
    const [products, ingredients] = await Promise.all([
      recipeApi.list(),
      inventoryApi.ingredients(),
    ])

    // Group rows by product name
    const byProduct = new Map<string, ImportRow[]>()
    rows.forEach((row) => {
      const name = String(row.productName).trim()
      if (!byProduct.has(name)) byProduct.set(name, [])
      byProduct.get(name)!.push(row)
    })

    for (const [productName, productRows] of byProduct) {
      try {
        // Find matching product
        const product = products.find(
          (p) => p.name.toLowerCase() === productName.toLowerCase()
        )
        if (!product) {
          errors.push(`Produk "${productName}" tidak ditemukan. Tambahkan produk terlebih dahulu.`)
          continue
        }

        // Build recipe items
        const items: { ingredientId: string; amount: number; unit: string; unitFactor: number }[] = []

        for (const row of productRows) {
          const ingName = String(row.ingredientName).trim()
          const ingredient = ingredients.find(
            (ing) => ing.name.toLowerCase() === ingName.toLowerCase()
          )
          if (!ingredient) {
            errors.push(`Bahan "${ingName}" tidak ditemukan di inventaris. Tambahkan bahan terlebih dahulu.`)
            continue
          }

          items.push({
            ingredientId: ingredient.id,
            amount: parseFloat(String(row.amount)) || 0,
            unit: String(row.unit).trim(),
            unitFactor: 1,
          })
        }

        if (items.length === 0) continue

        const batchSize = parseInt(String(productRows[0].batchSize ?? 1)) || 1

        await recipeApi.save(product.id, {
          batchSize,
          items,
        })
        success++
      } catch (err) {
        errors.push(`Produk "${productName}": ${err instanceof Error ? err.message : 'Error tidak diketahui'}`)
      }
    }

    qc.invalidateQueries({ queryKey: ['recipes'] })
    return { success, failed: byProduct.size - success, errors }
  }

  return { importRecipes }
}
