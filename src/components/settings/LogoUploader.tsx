import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Upload, Trash2, Loader2, ImagePlus, CheckCircle } from 'lucide-react'
import { settingsApi } from '../../services/settingsService'
import { cn } from '../../lib/utils'

interface LogoUploaderProps {
  currentLogo: string | null
  tenantName?: string
}

export default function LogoUploader({ currentLogo }: LogoUploaderProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-profile'] })
      qc.invalidateQueries({ queryKey: ['me'] })
      setPreview(null)
      setError(null)
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error ?? 'Upload gagal. Coba lagi.')
      setPreview(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => settingsApi.deleteLogo(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-profile'] })
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const handleFile = (file: File) => {
    setError(null)

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      setError('Format tidak didukung. Gunakan JPG, PNG, WEBP, atau SVG.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    uploadMutation.mutate(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const displayLogo = preview ?? currentLogo
  const isLoading = uploadMutation.isPending || deleteMutation.isPending

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {/* Logo preview */}
        <div
          className={cn(
            'w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden transition-all',
            dragOver ? 'border-crust-500 bg-dough-100' : 'border-dough-300 bg-dough-50',
            !displayLogo && 'cursor-pointer hover:border-crust-400 hover:bg-dough-100'
          )}
          onClick={() => !displayLogo && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 text-crust-400 animate-spin" />
          ) : displayLogo ? (
            <img
              src={displayLogo}
              alt="Logo toko"
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-crust-300">
              <ImagePlus className="w-7 h-7" />
              <span className="font-body text-[10px]">Logo</span>
            </div>
          )}
        </div>

        {/* Info + actions */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="font-body text-sm font-semibold text-oven-800">
              {displayLogo ? t('settings.logoUpload') : t('common.noData')}
            </p>
            <p className="font-body text-xs text-crust-400">
              JPG, PNG, WEBP, atau SVG · Maks 2MB
            </p>
            <p className="font-body text-xs text-crust-400">
              Ukuran ideal: 200×200px atau 400×400px
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 px-3 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {displayLogo ? t('settings.changeLogo') : t('settings.logoUpload')}
            </button>

            {currentLogo && (
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-sm font-body font-medium text-red-500
                           hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-colors
                           disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            )}
          </div>

          {uploadMutation.isSuccess && !preview && (
            <p className="flex items-center gap-1 font-body text-xs text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              Logo berhasil disimpan
            </p>
          )}

          {error && (
            <p className="font-body text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>

      {/* Drag & drop zone — shown when no logo */}
      {!displayLogo && (
        <div
          className={cn(
            'border-2 border-dashed rounded-2xl px-6 py-8 text-center cursor-pointer transition-all',
            dragOver ? 'border-crust-500 bg-dough-100' : 'border-dough-200 hover:border-crust-300 hover:bg-dough-50'
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-crust-300 mx-auto mb-2" />
          <p className="font-body text-sm text-crust-500">
            Drag & drop file logo ke sini, atau{' '}
            <span className="text-crust-600 font-medium underline">pilih file</span>
          </p>
          <p className="font-body text-xs text-crust-400 mt-1">
            Logo akan tampil di struk dan sidebar kasir
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = '' // reset so same file can be re-uploaded
        }}
      />
    </div>
  )
}
