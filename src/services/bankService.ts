import api from '../lib/api'

export interface BankInfo {
  bankName: string | null
  bankAccount: string | null
  bankHolder: string | null
}

export const bankApi = {
  get: async (): Promise<BankInfo> => {
    const res = await api.get('/settings/bank')
    return res.data
  },
  update: async (data: Partial<BankInfo>): Promise<BankInfo> => {
    const res = await api.patch('/settings/bank', data)
    return res.data
  },
}
