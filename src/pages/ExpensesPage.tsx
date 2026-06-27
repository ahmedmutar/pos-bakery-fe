import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Loader2, Receipt, TrendingDown, Calendar } from 'lucide-react'
import { expenseApi, EXPENSE_CATEGORY_LABELS, type Expense, type ExpenseCategory } from '../services/expenseService'
import { formatCurrency, formatDate, cn } from '../lib/utils'

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  UTILITIES:  'bg-blue-100 text-blue-700',
  SALARY:     'bg-purple-100 text-purple-700',
  RENT:       'bg-orange-100 text-orange-700',
  PACKAGING:  'bg-green-100 text-green-700',
  TRANSPORT:  'bg-cyan-100 text-cyan-700',
  MARKETING:  'bg-pink-100 text-pink-700',
  EQUIPMENT:  'bg-yellow-100 text-yellow-700',
  OTHER:      'bg-surface-100 text-muted-500',
}

interface ExpenseForm {
  date: string
  category: ExpenseCategory
  description: string
  amount: string
  notes: string
}

const defaultForm: ExpenseForm = {
  date: new Date().toISOString().split('T')[0],
  category: 'OTHER',
  description: '',
  amount: '',
  notes: '',
}

export default function ExpensesPage() {
  const qc = useQueryClient()
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  const [from, setFrom] = useState(firstDay.toISOString().split('T')[0])
  const [to, setTo]     = useState(today.toISOString().split('T')[0])

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ExpenseForm>(defaultForm)

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', from, to],
    queryFn: () => expenseApi.list(from, to),
  })

  const createMutation = useMutation({
    mutationFn: (f: ExpenseForm) => expenseApi.create({
      date: f.date,
      category: f.category,
      description: f.description,
      amount: parseInt(f.amount.replace(/\D/g, ''), 10),
      notes: f.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, f }: { id: string; f: ExpenseForm }) => expenseApi.update(id, {
      date: f.date,
      category: f.category,
      description: f.description,
      amount: parseInt(f.amount.replace(/\D/g, ''), 10),
      notes: f.notes || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: expenseApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }),
  })

  function resetForm() {
    setForm(defaultForm)
    setShowForm(false)
    setEditingId(null)
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id)
    setForm({
      date: expense.date.split('T')[0],
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      notes: expense.notes ?? '',
    })
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    if (editingId) {
      updateMutation.mutate({ id: editingId, f: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Receipt className="w-5 h-5 text-primary-600" />
          <h1 className="font-display text-xl font-bold text-dark-800">Pengeluaran</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted-400" />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input text-sm py-1.5 w-36" />
            <span className="font-body text-sm text-muted-400">–</span>
            <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input text-sm py-1.5 w-36" />
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultForm) }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="card">
            <p className="font-body text-xs text-muted-400 uppercase tracking-widest">Total Pengeluaran</p>
            <p className="font-display text-2xl font-bold text-red-600 mt-1">{formatCurrency(data.total)}</p>
          </div>
          <div className="card">
            <p className="font-body text-xs text-muted-400 uppercase tracking-widest">Jumlah Entri</p>
            <p className="font-display text-2xl font-bold text-dark-800 mt-1">{data.expenses.length}</p>
          </div>
          <div className="card col-span-2 md:col-span-1">
            <p className="font-body text-xs text-muted-400 uppercase tracking-widest mb-2">Per Kategori</p>
            <div className="space-y-1">
              {Object.entries(data.byCategory)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat as ExpenseCategory]}`}>
                      {EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]?.split(' ')[0]}
                    </span>
                    <span className="font-body text-xs font-semibold text-dark-700">{formatCurrency(amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Form tambah/edit */}
      {showForm && (
        <div className="card border-2 border-primary-200">
          <h2 className="font-display text-base font-semibold text-dark-800 mb-4">
            {editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">Kategori</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                  className="input w-full"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{EXPENSE_CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">Keterangan <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Contoh: Tagihan listrik Juli"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">Jumlah (Rp) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="input w-full"
                  min={1}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">Catatan (opsional)</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Tambahan info bila perlu"
                className="input w-full"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Simpan Perubahan' : 'Simpan'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense list */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-red-500" />
          <h2 className="font-display text-base font-semibold text-dark-800">Daftar Pengeluaran</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-muted-400 animate-spin" />
          </div>
        ) : !data?.expenses.length ? (
          <div className="text-center py-12">
            <Receipt className="w-10 h-10 text-muted-200 mx-auto mb-3" />
            <p className="font-body text-sm text-muted-400">Belum ada pengeluaran pada periode ini.</p>
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultForm) }}
              className="mt-3 text-sm text-primary-600 hover:underline font-body font-medium"
            >
              + Tambah pengeluaran pertama
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {data.expenses.map(expense => (
              <div
                key={expense.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-50 border border-surface-100 hover:border-surface-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-body font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[expense.category])}>
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </span>
                    <span className="font-body text-xs text-muted-400">{formatDate(expense.date)}</span>
                  </div>
                  <p className="font-body text-sm font-medium text-dark-700 mt-1 truncate">{expense.description}</p>
                  {expense.notes && (
                    <p className="font-body text-xs text-muted-400 truncate">{expense.notes}</p>
                  )}
                </div>
                <p className="font-display text-sm font-bold text-red-600 flex-shrink-0">{formatCurrency(expense.amount)}</p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(expense)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-400 hover:text-primary-600 hover:bg-surface-100 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Hapus pengeluaran ini?')) deleteMutation.mutate(expense.id) }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
