import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPin, Plus, X, Loader2, ToggleLeft, ToggleRight, Pencil, Check } from 'lucide-react'
import { settingsApi, type Outlet } from '../../services/settingsService'
import { cn } from '../../lib/utils'

export default function OutletsSection() {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [addName, setAddName] = useState('')
  const [addAddress, setAddAddress] = useState('')
  const [editName, setEditName] = useState('')
  const [editAddress, setEditAddress] = useState('')

  const { data: outlets = [], isLoading } = useQuery({
    queryKey: ['settings-outlets'],
    queryFn: settingsApi.getOutlets,
  })

  const createMutation = useMutation({
    mutationFn: () => settingsApi.createOutlet({
      name: addName.trim(),
      address: addAddress.trim() || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-outlets'] })
      qc.invalidateQueries({ queryKey: ['outlets'] })
      setShowAdd(false)
      setAddName('')
      setAddAddress('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; address?: string; isActive?: boolean } }) =>
      settingsApi.updateOutlet(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-outlets'] })
      qc.invalidateQueries({ queryKey: ['outlets'] })
      setEditId(null)
    },
  })

  const startEdit = (outlet: Outlet) => {
    setEditId(outlet.id)
    setEditName(outlet.name)
    setEditAddress(outlet.address ?? '')
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-crust-100 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-crust-600" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-oven-800">Outlet / Cabang</h3>
            <p className="font-body text-xs text-crust-400">{outlets.filter(o => o.isActive).length} outlet aktif</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Outlet
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-dough-50 rounded-xl p-4 space-y-3 border border-dough-200">
          <div className="flex items-center justify-between">
            <p className="font-body text-sm font-medium text-oven-800">Outlet Baru</p>
            <button onClick={() => setShowAdd(false)} className="text-crust-400 hover:text-crust-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-body text-crust-600 mb-1">Nama Outlet</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Bakery Sejahtera - Pusat"
                className="input text-sm bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-body text-crust-600 mb-1">Alamat (opsional)</label>
              <input
                type="text"
                value={addAddress}
                onChange={(e) => setAddAddress(e.target.value)}
                placeholder="Jl. Raya No. 1..."
                className="input text-sm bg-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !addName.trim()}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* Outlet list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 text-crust-400 animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-dough-100">
          {outlets.map((outlet) => (
            <div key={outlet.id} className="py-3 flex items-start gap-3">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                outlet.isActive ? 'bg-green-100' : 'bg-dough-100'
              )}>
                <MapPin className={cn('w-4 h-4', outlet.isActive ? 'text-green-600' : 'text-crust-300')} />
              </div>

              <div className="flex-1 min-w-0">
                {editId === outlet.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input text-sm py-1.5"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="Alamat..."
                        className="input text-sm py-1.5"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditId(null)} className="btn-secondary text-xs px-3 py-1.5">
                        Batal
                      </button>
                      <button
                        onClick={() => updateMutation.mutate({
                          id: outlet.id,
                          data: { name: editName, address: editAddress || undefined },
                        })}
                        disabled={updateMutation.isPending || !editName.trim()}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        {updateMutation.isPending
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Check className="w-3 h-3" />
                        }
                        Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className={cn(
                      'font-body text-sm font-medium',
                      outlet.isActive ? 'text-oven-800' : 'text-crust-400'
                    )}>
                      {outlet.name}
                    </p>
                    {outlet.address && (
                      <p className="font-body text-xs text-crust-400 mt-0.5">{outlet.address}</p>
                    )}
                  </>
                )}
              </div>

              {editId !== outlet.id && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(outlet)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-crust-400
                               hover:bg-dough-100 hover:text-crust-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateMutation.mutate({ id: outlet.id, data: { isActive: !outlet.isActive } })}
                    title={outlet.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {outlet.isActive
                      ? <ToggleRight className="w-5 h-5 text-green-500 hover:text-green-600" />
                      : <ToggleLeft className="w-5 h-5 text-crust-300 hover:text-crust-500" />
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
