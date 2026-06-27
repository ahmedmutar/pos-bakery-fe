import api from '../lib/api'

export type ExpenseCategory =
  | 'UTILITIES' | 'SALARY' | 'RENT' | 'PACKAGING'
  | 'TRANSPORT' | 'MARKETING' | 'EQUIPMENT' | 'OTHER'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  UTILITIES:  'Utilitas (Listrik/Air/Gas)',
  SALARY:     'Gaji Karyawan',
  RENT:       'Sewa Tempat',
  PACKAGING:  'Bahan Kemasan',
  TRANSPORT:  'Transportasi',
  MARKETING:  'Iklan & Promosi',
  EQUIPMENT:  'Peralatan',
  OTHER:      'Lain-lain',
}

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  notes?: string | null
  createdAt: string
}

export interface ExpenseListResponse {
  expenses: Expense[]
  total: number
  byCategory: Partial<Record<ExpenseCategory, number>>
}

export const expenseApi = {
  list: (from?: string, to?: string): Promise<ExpenseListResponse> =>
    api.get('/expenses', { params: { from, to } }).then(r => r.data),

  create: (data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> =>
    api.post('/expenses', data).then(r => r.data),

  update: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense> =>
    api.patch(`/expenses/${id}`, data).then(r => r.data),

  remove: (id: string): Promise<{ success: boolean }> =>
    api.delete(`/expenses/${id}`).then(r => r.data),
}
