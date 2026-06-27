import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PlanGate from '../components/ui/PlanGate'

// Mock usePlan hook
vi.mock('../hooks/usePlan', () => ({
  usePlan: vi.fn(),
  PLAN_LABELS: {
    basic:      'Basic',
    pro:        'Pro',
    enterprise: 'Enterprise',
  },
  FEATURE_REQUIRED_PLAN: {
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
    hasForecast:        'pro',
    hasExcelImport:     'pro',
    hasResellers:       'enterprise',
    hasApiAccess:       'enterprise',
    hasWhiteLabel:      'enterprise',
    hasReports:         'basic',
  },
}))

import { usePlan } from '../hooks/usePlan'

function buildPlanData(plan: 'basic' | 'pro' | 'enterprise', featureOverrides: Record<string, boolean> = {}) {
  const base: Record<string, boolean | number> = {
    maxOutlets: plan === 'basic' ? 1 : plan === 'pro' ? 3 : -1,
    maxUsers: plan === 'basic' ? 2 : plan === 'pro' ? 5 : -1,
    maxProducts: plan === 'basic' ? 50 : -1,
    maxPreOrdersPerMonth: plan === 'basic' ? 20 : -1,
    hasReports: true,
    hasForecast: plan !== 'basic',
    hasExcelImport: plan !== 'basic',
    hasApiAccess: plan === 'enterprise',
    hasWhiteLabel: plan === 'enterprise',
    hasInventory: plan !== 'basic',
    hasRecipes: plan !== 'basic',
    hasProduction: plan !== 'basic',
    hasExpenses: plan !== 'basic',
    hasWaNotifications: plan !== 'basic',
    hasCustomers: plan !== 'basic',
    hasLoyalty: plan !== 'basic',
    hasBroadcast: plan !== 'basic',
    hasPurchaseOrders: plan !== 'basic',
    hasPublicOrderLink: plan !== 'basic',
    hasResellers: plan === 'enterprise',
    ...featureOverrides,
  }
  return {
    plan,
    limits: base,
    trial: { isOnTrial: false, expired: false, daysLeft: 0 },
  }
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

// ─── Loading state (optimistic) ───────────────────────────────────────────────

describe('PlanGate — loading state', () => {
  it('renders children while plan data is loading', () => {
    vi.mocked(usePlan).mockReturnValue({ data: undefined, isLoading: true } as never)

    render(
      <Wrapper>
        <PlanGate feature="hasInventory" featureName="Inventori">
          <div data-testid="protected-content">Content</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })
})

// ─── Access granted ───────────────────────────────────────────────────────────

describe('PlanGate — access granted', () => {
  it('renders children when Pro plan has Pro feature', () => {
    vi.mocked(usePlan).mockReturnValue({ data: buildPlanData('pro'), isLoading: false } as never)

    render(
      <Wrapper>
        <PlanGate feature="hasInventory" featureName="Inventori">
          <div data-testid="protected-content">Inventori Content</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('renders children when Enterprise plan has Enterprise feature', () => {
    vi.mocked(usePlan).mockReturnValue({ data: buildPlanData('enterprise'), isLoading: false } as never)

    render(
      <Wrapper>
        <PlanGate feature="hasResellers" featureName="Reseller">
          <div data-testid="reseller-content">Reseller</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.getByTestId('reseller-content')).toBeInTheDocument()
  })

  it('renders children for basic feature on basic plan', () => {
    vi.mocked(usePlan).mockReturnValue({ data: buildPlanData('basic'), isLoading: false } as never)

    render(
      <Wrapper>
        <PlanGate feature="hasReports" featureName="Laporan">
          <div data-testid="reports-content">Reports</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.getByTestId('reports-content')).toBeInTheDocument()
  })
})

// ─── Access denied — upgrade wall ─────────────────────────────────────────────

describe('PlanGate — upgrade wall', () => {
  beforeEach(() => {
    vi.mocked(usePlan).mockReturnValue({ data: buildPlanData('basic'), isLoading: false } as never)
  })

  it('does NOT render children when feature is blocked', () => {
    render(
      <Wrapper>
        <PlanGate feature="hasInventory" featureName="Inventori & Bahan Baku">
          <div data-testid="protected-content">Secret Content</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('shows the feature name in upgrade wall', () => {
    render(
      <Wrapper>
        <PlanGate feature="hasInventory" featureName="Inventori & Bahan Baku">
          <div>Content</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.getByText('Inventori & Bahan Baku')).toBeInTheDocument()
  })

  it('shows upgrade CTA button', () => {
    render(
      <Wrapper>
        <PlanGate feature="hasInventory" featureName="Inventori">
          <div>Content</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.getByRole('button', { name: /upgrade/i })).toBeInTheDocument()
  })

  it('shows required plan label (Pro) in upgrade wall', () => {
    render(
      <Wrapper>
        <PlanGate feature="hasInventory" featureName="Inventori">
          <div>Content</div>
        </PlanGate>
      </Wrapper>
    )

    // Multiple "Pro" texts appear (description + card + button) — all are correct
    expect(screen.getAllByText(/Pro/).length).toBeGreaterThan(0)
  })

  it('shows Enterprise label for Enterprise-only features', () => {
    render(
      <Wrapper>
        <PlanGate feature="hasResellers" featureName="Reseller">
          <div>Content</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.getAllByText(/Enterprise/).length).toBeGreaterThan(0)
  })

  it('shows back button', () => {
    render(
      <Wrapper>
        <PlanGate feature="hasInventory" featureName="Inventori">
          <div>Content</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.getByRole('button', { name: /kembali/i })).toBeInTheDocument()
  })
})

// ─── Pro plan blocked from Enterprise features ────────────────────────────────

describe('PlanGate — Pro blocked from Enterprise', () => {
  it('shows upgrade wall for Enterprise-only features on Pro plan', () => {
    vi.mocked(usePlan).mockReturnValue({ data: buildPlanData('pro'), isLoading: false } as never)

    render(
      <Wrapper>
        <PlanGate feature="hasResellers" featureName="Manajemen Reseller">
          <div data-testid="reseller-content">Reseller</div>
        </PlanGate>
      </Wrapper>
    )

    expect(screen.queryByTestId('reseller-content')).not.toBeInTheDocument()
    expect(screen.getByText('Manajemen Reseller')).toBeInTheDocument()
  })
})
