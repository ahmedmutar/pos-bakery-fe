import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

type Role = 'OWNER' | 'CASHIER' | 'PRODUCTION'

interface RoleGuardProps {
  allow: Role[]
  children: React.ReactNode
  redirectTo?: string
}

export default function RoleGuard({ allow, children, redirectTo = '/dashboard' }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)

  if (!user || !allow.includes(user.role as Role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
