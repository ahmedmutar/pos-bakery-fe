import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface PlanLimits {
  // Numeric limits
  maxOutlets: number
  maxUsers: number
  maxProducts: number
  maxPreOrdersPerMonth: number

  // Original features
  hasReports: boolean
  hasForecast: boolean
  hasExcelImport: boolean
  hasApiAccess: boolean
  hasWhiteLabel: boolean

  // P0 features
  hasInventory: boolean
  hasRecipes: boolean
  hasProduction: boolean
  hasExpenses: boolean
  hasWaNotifications: boolean

  // P2 features
  hasCustomers: boolean
  hasLoyalty: boolean
  hasBroadcast: boolean
  hasPurchaseOrders: boolean

  // P3 features
  hasPublicOrderLink: boolean
  hasResellers: boolean
}

export interface PlanStatus {
  plan: string
  subscription: {
    id: string
    plan: string
    periodEnd: string | null
    daysLeft: number | null
    expired: boolean
  } | null
  limits: PlanLimits
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
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

/** Convenience hook: returns true if feature is available on current plan */
export function usePlanFeature(feature: keyof PlanLimits): boolean {
  const { data } = usePlan()
  if (!data) return true // optimistic: allow while loading
  const val = data.limits[feature]
  if (typeof val === 'boolean') return val
  return true // numeric limits are not boolean gates
}

export const PLAN_LABELS: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export const PLAN_COLORS: Record<string, string> = {
  basic:      'bg-surface-100 text-muted-600 border-surface-300',
  pro:        'bg-primary-50 text-primary-700 border-primary-200',
  enterprise: 'bg-dark-800 text-white border-dark-700',
}

/** Which plan is required for each feature */
export const FEATURE_REQUIRED_PLAN: Partial<Record<keyof PlanLimits, 'pro' | 'enterprise'>> = {
  hasForecast:        'pro',
  hasExcelImport:     'pro',
  hasInventory:       'pro',
  hasRecipes:         'pro',
  hasProduction:      'pro',
  hasExpenses:        'pro',
  hasWaNotifications: 'pro',
  hasCustomers:       'pro',
  hasLoyalty:         'pro',
  hasBroadcast:       'pro',
  hasPurchaseOrders:  'pro',
  hasPublicOrderLink: 'pro',
  hasApiAccess:       'enterprise',
  hasWhiteLabel:      'enterprise',
  hasResellers:       'enterprise',
}
