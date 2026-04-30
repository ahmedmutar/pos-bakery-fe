import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Store, Loader2, Check, Pencil, RotateCcw } from 'lucide-react'
import { settingsApi } from '../../services/settingsService'
import LogoUploader from './LogoUploader'
import { useOnboarding } from '../../hooks/useOnboarding'

export default function ProfileSection() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  const { t } = useTranslation()
  const { reset: resetOnboarding } = useOnboarding()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['settings-profile'],
    queryFn: settingsApi.getProfile,
  })

  // Sync name when profile loads
  if (profile && !editing && name !== profile.name) {
    setName(profile.name)
  }

  const mutation = useMutation({
    mutationFn: () => settingsApi.updateProfile(name.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-profile'] })
      setEditing(false)
    },
  })

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center h-28">
        <Loader2 className="w-5 h-5 text-muted-400 animate-spin" />
      </div>
    )
  }

  const PLAN_LABELS: Record<string, string> = {
    basic: 'Basic',
    pro: 'Pro',
    enterprise: 'Enterprise',
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center">
          <Store className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-dark-800">Profil Toko</h3>
          <p className="font-body text-xs text-muted-400">Informasi dasar toko Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Store name */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
            Nama Toko
          </label>
          {editing ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input text-sm flex-1"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') mutation.mutate() }}
              />
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !name.trim()}
                className="btn-primary px-3 flex items-center gap-1"
              >
                {mutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary px-3">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="font-body text-sm font-medium text-dark-800">{profile?.name}</p>
              <button
                onClick={() => setEditing(true)}
                className="text-muted-400 hover:text-primary-600 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Logo */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-3">{t('settings.logoUpload')}</label>
          <LogoUploader
            currentLogo={profile?.logoUrl ?? null}
            tenantName={profile?.name ?? ''}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">{t('settings.storeSlug')}</label>
          <p className="font-mono text-sm text-muted-500">{profile?.slug}</p>
        </div>

        {/* Plan */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">{t('settings.plan')}</label>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-medium bg-surface-100 text-primary-700">
            {PLAN_LABELS[profile?.plan ?? 'basic'] ?? profile?.plan}
          </span>
        </div>

        {/* Member since */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">{t('settings.memberSince')}</label>
          <p className="font-body text-sm text-dark-700">
            {profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              : '—'}
          </p>
        </div>
      </div>

      {/* Reset onboarding */}
      <div className="pt-2 border-t border-surface-200 mt-2">
        <button
          onClick={resetOnboarding}
          className="flex items-center gap-2 text-sm font-body text-muted-400 hover:text-primary-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Ulangi wizard setup
        </button>
      </div>
    </div>
  )
}
