import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { productApi } from '../services/productService'

const ONBOARDING_KEY = 'onboarding_completed'

export function useOnboarding() {
  const user = useAuthStore((s) => s.user)
  const [show, setShow] = useState(false)

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.list(),
    enabled: !!user && user.role === 'OWNER',
  })

  useEffect(() => {
    if (!user || user.role !== 'OWNER') return

    // Check if onboarding was already completed for this tenant
    const key = `${ONBOARDING_KEY}_${user.tenantId}`
    const done = localStorage.getItem(key)
    if (done) return

    // Show onboarding if no products yet and not completed
    if (products !== undefined && products.length === 0) {
      setShow(true)
    }
  }, [user, products])

  const complete = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${user.tenantId}`, '1')
    }
    setShow(false)
  }

  const reset = () => {
    if (user) {
      localStorage.removeItem(`${ONBOARDING_KEY}_${user.tenantId}`)
    }
    setShow(true)
  }

  return { show, complete, reset }
}
