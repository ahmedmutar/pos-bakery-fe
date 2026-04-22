import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function SmartRedirect() {
  const user = useAuthStore((s) => s.user)

  if (user?.role === 'CASHIER') return <Navigate to="/app/cashier" replace />
  if (user?.role === 'PRODUCTION') return <Navigate to="/app/production" replace />
  return <Navigate to="/app/dashboard" replace />
}
