import api from '../lib/api'

export type DiscountType = 'FLAT' | 'PERCENT'

export interface VoucherCode {
  id: string
  tenantId: string
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  minOrderValue: number
  maxUsage: number | null
  usageCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export interface ValidateVoucherResponse {
  valid: boolean
  voucherId: string
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  discountAmount: number
}

export interface CreateVoucherPayload {
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  minOrderValue?: number
  maxUsage?: number | null
  expiresAt?: string | null
  isActive?: boolean
}

export const voucherApi = {
  list: async (): Promise<VoucherCode[]> => {
    const res = await api.get('/vouchers')
    return res.data
  },

  create: async (data: CreateVoucherPayload): Promise<VoucherCode> => {
    const res = await api.post('/vouchers', data)
    return res.data
  },

  update: async (id: string, data: Partial<CreateVoucherPayload>): Promise<VoucherCode> => {
    const res = await api.patch(`/vouchers/${id}`, data)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/vouchers/${id}`)
  },

  validate: async (code: string, orderValue: number): Promise<ValidateVoucherResponse> => {
    const res = await api.post('/vouchers/validate', { code, orderValue })
    return res.data
  },
}
