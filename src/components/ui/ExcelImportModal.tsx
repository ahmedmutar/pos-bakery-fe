import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, X, AlertTriangle, CheckCircle, Download, Loader2, FileSpreadsheet } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ImportColumn {
  key: string
  label: string
  required?: boolean
  example?: string
}

export interface ImportRow {
  [key: string]: string | number | null
}

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

interface ExcelImportModalProps {
  title: string
  columns: ImportColumn[]
  templateFilename: string
  onImport: (rows: ImportRow[]) => Promise<ImportResult>
  onClose: () => void
  onSuccess: () => void
}

export default function ExcelImportModal({
  title,
  columns,
  templateFilename,
  onImport,
  onClose,
  onSuccess,
}: ExcelImportModalProps) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<ImportRow[] | null>(null)
  const [filename, setFilename] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Download template
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new()
    const headers = columns.map((c) => c.label)
    const example = columns.map((c) => c.example ?? '')
    const ws = XLSX.utils.aoa_to_sheet([headers, example])

    // Column widths
    ws['!cols'] = columns.map(() => ({ wch: 20 }))

    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, templateFilename)
  }

  // Parse uploaded file
  const parseFile = (file: File) => {
    setParseError(null)
    setPreview(null)
    setResult(null)
    setFilename(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

        if (raw.length === 0) {
          setParseError('File kosong. Pastikan data dimulai dari baris kedua.')
          return
        }

        // Map column labels to keys
        const labelToKey: Record<string, string> = {}
        columns.forEach((col) => { labelToKey[col.label] = col.key })

        const rows: ImportRow[] = raw.map((row) => {
          const mapped: ImportRow = {}
          Object.entries(row).forEach(([header, val]) => {
            const key = labelToKey[header]
            if (key) mapped[key] = val as string | number | null
          })
          return mapped
        })

        // Validate required fields
        const missing: string[] = []
        const requiredCols = columns.filter((c) => c.required)
        rows.forEach((row, i) => {
          requiredCols.forEach((col) => {
            if (!row[col.key] && row[col.key] !== 0) {
              missing.push(`Baris ${i + 2}: kolom "${col.label}" kosong`)
            }
          })
        })

        if (missing.length > 0) {
          setParseError(`Ditemukan ${missing.length} baris tidak valid:\n${missing.slice(0, 5).join('\n')}${missing.length > 5 ? `\n...dan ${missing.length - 5} lainnya` : ''}`)
        }

        setPreview(rows)
      } catch {
        setParseError('Gagal membaca file. Pastikan format file adalah .xlsx atau .xls.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  const handleImport = async () => {
    if (!preview) return
    setImporting(true)
    try {
      const res = await onImport(preview)
      setResult(res)
      if (res.failed === 0) {
        setTimeout(() => { onSuccess(); onClose() }, 1500)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <h2 className="font-display text-base font-semibold text-dark-800">{title}</h2>
          </div>
          <button onClick={onClose} className="text-muted-400 hover:text-primary-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Step 1: Download template */}
          <div className="flex items-center justify-between bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
            <div>
              <p className="font-body text-sm font-semibold text-dark-800">1. Download template</p>
              <p className="font-body text-xs text-muted-400 mt-0.5">
                Isi data di template, lalu upload kembali
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-body font-medium
                         bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Template .xlsx
            </button>
          </div>

          {/* Column info */}
          <div className="border border-surface-200 rounded-xl overflow-hidden">
            <div className="bg-surface-50 px-4 py-2 border-b border-surface-200">
              <p className="font-body text-xs font-semibold text-muted-500 uppercase tracking-widest">
                Kolom yang dibutuhkan
              </p>
            </div>
            <div className="divide-y divide-surface-100">
              {columns.map((col) => (
                <div key={col.key} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm text-dark-800">{col.label}</span>
                    {col.required && (
                      <span className="text-[10px] font-body font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        wajib
                      </span>
                    )}
                  </div>
                  {col.example && (
                    <span className="font-mono text-xs text-muted-400">contoh: {col.example}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Upload */}
          <div>
            <p className="font-body text-sm font-semibold text-dark-800 mb-2">2. Upload file</p>
            <div
              className={cn(
                'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all',
                dragOver ? 'border-primary-500 bg-surface-100' :
                preview ? 'border-green-400 bg-green-50' :
                'border-surface-300 hover:border-primary-400 hover:bg-surface-50'
              )}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <p className="font-body text-sm font-semibold text-green-700">{filename}</p>
                  <p className="font-body text-xs text-green-600">{preview.length} baris siap diimport</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreview(null); setFilename('') }}
                    className="text-xs text-muted-400 underline mt-1"
                  >
                    Ganti file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-surface-300" />
                  <p className="font-body text-sm text-muted-500">
                    Drag & drop file .xlsx ke sini, atau{' '}
                    <span className="text-primary-700 font-medium underline">pilih file</span>
                  </p>
                  <p className="font-body text-xs text-muted-400">Format: .xlsx atau .xls</p>
                </div>
              )}
            </div>
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="font-body text-xs text-red-600 whitespace-pre-line">{parseError}</p>
            </div>
          )}

          {/* Preview table */}
          {preview && preview.length > 0 && (
            <div>
              <p className="font-body text-xs text-muted-500 mb-2">
                Preview {Math.min(3, preview.length)} dari {preview.length} baris:
              </p>
              <div className="overflow-x-auto rounded-xl border border-surface-200">
                <table className="w-full text-xs">
                  <thead className="bg-surface-50">
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} className="text-left px-3 py-2 font-body font-semibold text-muted-500 uppercase tracking-wide whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {preview.slice(0, 3).map((row, i) => (
                      <tr key={i} className="hover:bg-surface-50">
                        {columns.map((col) => (
                          <td key={col.key} className="px-3 py-2 font-body text-dark-700 whitespace-nowrap">
                            {String(row[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={cn(
              'rounded-xl px-4 py-3 flex items-start gap-3',
              result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
            )}>
              {result.failed === 0
                ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              }
              <div>
                <p className="font-body text-sm font-semibold text-dark-800">
                  {result.success} berhasil diimport
                  {result.failed > 0 && `, ${result.failed} gagal`}
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <li key={i} className="font-body text-xs text-amber-700">{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-surface-200 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Tutup</button>
          <button
            onClick={handleImport}
            disabled={!preview || !!parseError || importing || !!result}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {importing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengimport...</>
              : <><Upload className="w-4 h-4" /> Import {preview?.length ?? 0} Data</>
            }
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) parseFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
