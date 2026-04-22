import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, Trash2, Loader2, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { settingsApi } from '../../services/settingsService'
import { authApi } from '../../services/authService'
import { cn } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'



export default function AvatarButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, logout, login } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadAvatar(file),
    onSuccess: (data) => {
      // Update user in store immediately — no re-fetch needed
      if (user) {
        login({ ...user, avatarUrl: data.avatarUrl }, useAuthStore.getState().token!)
      }
      qc.invalidateQueries({ queryKey: ['me'] })
      setOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => settingsApi.deleteAvatar(),
    onSuccess: () => {
      if (user) {
        login({ ...user, avatarUrl: null }, useAuthStore.getState().token!)
      }
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const handleLogout = async () => {
    await authApi.logout()
    logout()
    navigate('/login')
  }

  const handleFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return
    if (file.size > 2 * 1024 * 1024) return
    uploadMutation.mutate(file)
  }

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  const isLoading = uploadMutation.isPending || deleteMutation.isPending

  return (
    <div className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center',
          'ring-2 ring-offset-1 transition-all',
          open ? 'ring-crust-500' : 'ring-transparent hover:ring-crust-300'
        )}
      >
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-crust-600 flex items-center justify-center shadow-warm">
            <span className="font-body text-sm font-semibold text-cream">{initials}</span>
          </div>
        )}
      </button>

      {/* Popover */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl shadow-warm-lg border border-dough-200 z-40 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-4 border-b border-dough-100">
              <div className="flex items-center gap-3">
                {/* Large avatar */}
                <div
                  className={cn(
                    'w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 relative group cursor-pointer',
                    'ring-2 ring-dough-200'
                  )}
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    const file = e.dataTransfer.files[0]
                    if (file) handleFile(file)
                  }}
                >
                  {isLoading ? (
                    <div className="w-full h-full bg-dough-100 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-crust-400 animate-spin" />
                    </div>
                  ) : user?.avatarUrl ? (
                    <>
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      <div className={cn(
                        'absolute inset-0 bg-oven-900/50 flex items-center justify-center transition-opacity',
                        dragOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}>
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-full h-full bg-crust-600 flex items-center justify-center">
                        <span className="font-display text-lg font-bold text-cream">{initials}</span>
                      </div>
                      <div className={cn(
                        'absolute inset-0 bg-oven-900/50 flex items-center justify-center transition-opacity',
                        dragOver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      )}>
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-oven-800 truncate">
                    {user?.name}
                  </p>
                  <p className="font-body text-xs text-crust-400 truncate">
                    {user?.email}
                  </p>
                  <span className="inline-flex mt-1 items-center px-1.5 py-0.5 rounded-md text-[10px] font-body font-semibold uppercase tracking-wide bg-dough-100 text-crust-600">
                    {t(`role.${user?.role ?? 'CASHIER'}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-3 py-2 space-y-0.5">
              <button
                onClick={() => inputRef.current?.click()}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body
                           text-crust-600 hover:bg-dough-50 transition-colors text-left disabled:opacity-50"
              >
                <Camera className="w-4 h-4 flex-shrink-0" />
                {user?.avatarUrl ? t('settings.changeAvatar') : t('settings.avatarUpload')}
              </button>

              {user?.avatarUrl && (
                <button
                  onClick={() => { deleteMutation.mutate(); setOpen(false) }}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body
                             text-red-500 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  Hapus foto
                </button>
              )}

              <div className="h-px bg-dough-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body
                           text-crust-600 hover:bg-dough-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Keluar
              </button>
            </div>

            {uploadMutation.isError && (
              <p className="px-4 pb-3 font-body text-xs text-red-500">
                {(uploadMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Upload gagal.'}
              </p>
            )}
          </div>
        </>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
