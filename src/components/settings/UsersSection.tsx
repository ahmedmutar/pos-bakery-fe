import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, X, Loader2, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { settingsApi, type StaffUser } from '../../services/settingsService'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../lib/utils'

const ROLE_LABELS: Record<StaffUser['role'], string> = {
  OWNER: 'Pemilik',
  CASHIER: 'Kasir',
  PRODUCTION: 'Produksi',
}

const ROLE_COLORS: Record<StaffUser['role'], string> = {
  OWNER: 'bg-surface-100 text-primary-700',
  CASHIER: 'bg-blue-100 text-blue-700',
  PRODUCTION: 'bg-amber-100 text-amber-700',
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: StaffUser['role']
}

const emptyForm = (): UserFormData => ({
  name: '', email: '', password: '', role: 'CASHIER',
})

export default function UsersSection() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState<StaffUser | null>(null)
  const [form, setForm] = useState<UserFormData>(emptyForm())
  const [error, setError] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['settings-users'],
    queryFn: settingsApi.getUsers,
  })

  const createMutation = useMutation({
    mutationFn: () => settingsApi.createUser(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-users'] })
      setShowAdd(false)
      setForm(emptyForm())
      setError('')
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error ?? 'Gagal menambah staff')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffUser> }) =>
      settingsApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-users'] })
      setEditUser(null)
    },
  })

  const toggleActive = (user: StaffUser) => {
    updateMutation.mutate({ id: user.id, data: { isActive: !user.isActive } })
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-dark-800">Manajemen Staff</h3>
            <p className="font-body text-xs text-muted-400">{users.length} akun terdaftar</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd(true); setForm(emptyForm()); setError('') }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Staff
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-surface-50 rounded-xl p-4 space-y-3 border border-surface-200">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm font-medium text-dark-800">Staff Baru</p>
            <button onClick={() => setShowAdd(false)} className="text-muted-400 hover:text-primary-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-body text-primary-600 mb-1">Nama</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama lengkap"
                className="input text-sm bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-body text-primary-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@toko.com"
                className="input text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-body text-primary-600 mb-1">Kata Sandi</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 karakter"
                className="input text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-body text-primary-600 mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as StaffUser['role'] }))}
                className="input text-sm bg-white"
              >
                <option value="CASHIER">Kasir</option>
                <option value="PRODUCTION">Produksi</option>
                <option value="OWNER">Pemilik</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-body">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.name || !form.email || !form.password}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* User list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 text-muted-400 animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-surface-100">
          {users.map((user) => (
            <div key={user.id} className="py-3 flex items-center gap-3">
              {/* Avatar */}
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center font-body text-sm font-semibold flex-shrink-0',
                user.isActive ? 'bg-primary-600 text-white' : 'bg-surface-200 text-muted-400'
              )}>
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {editUser?.id === user.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue={user.name}
                      onBlur={(e) => updateMutation.mutate({
                        id: user.id, data: { name: e.target.value },
                      })}
                      className="input text-sm py-1 flex-1"
                      autoFocus
                    />
                    <select
                      defaultValue={user.role}
                      onChange={(e) => updateMutation.mutate({
                        id: user.id, data: { role: e.target.value as StaffUser['role'] },
                      })}
                      className="input text-sm py-1 w-32"
                    >
                      <option value="CASHIER">Kasir</option>
                      <option value="PRODUCTION">Produksi</option>
                      <option value="OWNER">Pemilik</option>
                    </select>
                    <button onClick={() => setEditUser(null)} className="text-muted-400 hover:text-primary-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      'font-body text-sm font-medium truncate',
                      user.isActive ? 'text-dark-800' : 'text-muted-400'
                    )}>
                      {user.name}
                      {user.id === currentUser?.id && (
                        <span className="ml-1.5 font-body text-xs text-muted-400">(Anda)</span>
                      )}
                    </p>
                    <span className={cn('text-xs font-body font-medium px-2 py-0.5 rounded-full flex-shrink-0', ROLE_COLORS[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                )}
                <p className="font-body text-xs text-muted-400 truncate mt-0.5">{user.email}</p>
              </div>

              {/* Actions */}
              {user.id !== currentUser?.id && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditUser(editUser?.id === user.id ? null : user)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-400
                               hover:bg-surface-100 hover:text-primary-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(user)}
                    title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    className="transition-colors"
                  >
                    {user.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500 hover:text-green-600" />
                      : <ToggleLeft className="w-5 h-5 text-surface-300 hover:text-muted-500" />
                    }
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
