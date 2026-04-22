import { useState, useRef, useEffect } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ExportOption {
  label: string
  format: 'excel' | 'pdf'
  onExport: () => Promise<void> | void
}

interface ExportButtonProps {
  options: ExportOption[]
  disabled?: boolean
}

export default function ExportButton({ options, disabled }: ExportButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExport = async (option: ExportOption) => {
    setLoading(option.label)
    setOpen(false)
    try {
      await option.onExport()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || !!loading}
        className={cn(
          'btn-secondary flex items-center gap-2 text-sm',
          (disabled || !!loading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {loading ?? 'Export'}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-warm-lg border border-dough-200 z-10 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleExport(opt)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-crust-700
                         hover:bg-dough-50 transition-colors text-left"
            >
              {opt.format === 'excel' ? (
                <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
