import { useCallback } from 'react'

export function usePrint() {
  const printHTML = useCallback((htmlContent: string) => {
    const printWindow = window.open('', '_blank', 'width=420,height=700')
    if (!printWindow) {
      alert('Pop-up diblokir browser. Izinkan pop-up di address bar untuk mencetak struk.')
      return
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Struk</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.5;
      color: #000;
      background: #fff;
      padding: 8px;
    }
    .receipt-header { text-align: center; margin-bottom: 8px; }
    .receipt-title { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
    .receipt-subtitle { font-size: 10px; margin-top: 2px; }
    .receipt-divider { border-top: 1px dashed #000; margin: 6px 0; }
    .receipt-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 1px; }
    .receipt-section-title { font-weight: bold; font-size: 11px; margin-bottom: 3px; }
    .receipt-item { margin-bottom: 5px; }
    .receipt-item-name { font-weight: bold; font-size: 11px; }
    .receipt-item-note { font-size: 10px; font-style: italic; }
    .receipt-total { font-size: 13px; font-weight: bold; }
    .receipt-footer { text-align: center; font-size: 10px; margin-top: 6px; }
    .receipt-stars { letter-spacing: 2px; margin: 4px 0; }
    .receipt-powered { font-size: 9px; color: #666; }
    @media print {
      body { padding: 4px; }
      @page { size: 58mm auto; margin: 0; }
    }
  </style>
</head>
<body>
${htmlContent}
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); window.close(); }, 150);
  }
<\/script>
</body>
</html>`)

    printWindow.document.close()
  }, [])

  return { printHTML }
}
