import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface PlanStatus {
  plan: string
  limits: {
    maxOutlets: number
    maxUsers: number
    maxProducts: number
    hasReports: boolean
    hasForecast: boolean
    hasExcelImport: boolean
    hasApiAccess: boolean
    hasWhiteLabel: boolean
  }
  trial: {
    isOnTrial: boolean
    trialEndsAt: string | null
    daysLeft: number
    expired: boolean
  }
}

export function usePlan() {
  return useQuery<PlanStatus>({
    queryKey: ['plan-status'],
    queryFn: async () => {
      const res = await api.get('/settings/plan')
      return res.data
    },
    staleTime: 5 * 60 * 1000, // 5 menit
    retry: false,
  })
}

export const PLAN_LABELS: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export const PLAN_COLORS: Record<string, string> = {
  basic: 'bg-dough-100 text-crust-700 border-dough-300',
  pro: 'bg-crust-100 text-crust-700 border-crust-300',
  enterprise: 'bg-oven-100 text-oven-700 border-oven-300',
}
