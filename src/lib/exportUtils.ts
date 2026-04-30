import * as XLSX from 'xlsx'

// ─── Excel export ───────────────────────────────────────────────────────────

interface SheetData {
  name: string
  headers: string[]
  rows: (string | number)[][]
}

export function exportToExcel(filename: string, sheets: SheetData[]) {
  const wb = XLSX.utils.book_new()

  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows])

    // Auto column widths
    const colWidths = sheet.headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...sheet.rows.map((r) => String(r[i] ?? '').length)
      )
      return { wch: Math.min(maxLen + 2, 40) }
    })
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  }

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ─── PDF export via browser print ───────────────────────────────────────────

interface TableData {
  title: string
  subtitle?: string
  headers: string[]
  rows: (string | number)[][]
  totalsRow?: (string | number)[]
}

export function exportTableToPDF(data: TableData) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const rowsHTML = data.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`
    )
    .join('')

  const totalsHTML = data.totalsRow
    ? `<tr class="totals">${data.totalsRow.map((cell) => `<td><strong>${cell}</strong></td>`).join('')}</tr>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; color: #1a110c; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    .subtitle { color: #7a5c3a; font-size: 11px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f7edda; padding: 8px; text-align: left; border-bottom: 2px solid #c98a38; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 7px 8px; border-bottom: 1px solid #f5d9a8; }
    tr:hover td { background: #fefcf8; }
    tr.totals td { background: #f7edda; border-top: 2px solid #c98a38; }
    .footer { margin-top: 12px; font-size: 10px; color: #7a5c3a; }
    @media print {
      body { margin: 10mm; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
  <table>
    <thead>
      <tr>${data.headers.map((h) => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rowsHTML}
      ${totalsHTML}
    </tbody>
  </table>
  <div class="footer">
    Dicetak pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
    · Sajiin
  </div>
</body>
</html>`

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 300)
}

// ─── Format helpers ──────────────────────────────────────────────────────────

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
