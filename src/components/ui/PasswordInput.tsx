import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface PasswordRule {
  label: string
  test: (pw: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Minimal 8 karakter',  test: pw => pw.length >= 8 },
  { label: '1 huruf besar (A-Z)', test: pw => /[A-Z]/.test(pw) },
  { label: '1 angka (0-9)',       test: pw => /[0-9]/.test(pw) },
  { label: '1 simbol (!@#$...)',  test: pw => /[^A-Za-z0-9]/.test(pw) },
]

export function validatePassword(pw: string): string | null {
  if (!pw) return 'Password wajib diisi'
  if (pw.length < 8) return 'Password minimal 8 karakter'
  if (!/[A-Z]/.test(pw)) return 'Password harus mengandung minimal 1 huruf besar'
  if (!/[0-9]/.test(pw)) return 'Password harus mengandung minimal 1 angka'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Password harus mengandung minimal 1 simbol'
  return null
}

export function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  const passed = PASSWORD_RULES.filter(r => r.test(pw)).length
  if (passed === 0 || pw.length === 0) return { score: 0, label: '',        color: '' }
  if (passed === 1)                     return { score: 1, label: 'Lemah',   color: 'bg-red-500' }
  if (passed === 2)                     return { score: 2, label: 'Sedang',  color: 'bg-amber-400' }
  if (passed === 3)                     return { score: 3, label: 'Kuat',    color: 'bg-blue-500' }
  return                                       { score: 4, label: 'Sangat Kuat', color: 'bg-green-500' }
}

interface PasswordInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  showRules?: boolean
  className?: string
  autoFocus?: boolean
  onEnter?: () => void
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = 'Password',
  label,
  showRules = true,
  className = '',
  autoFocus = false,
  onEnter,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)
  const strength = getPasswordStrength(value)

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-body font-medium text-muted-500 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="input pr-10"
          onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 hover:text-muted-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Strength bar */}
      {value && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  strength.score >= i ? strength.color : 'bg-surface-200'
                )}
              />
            ))}
          </div>
          {strength.label && (
            <p className={cn(
              'text-xs font-medium',
              strength.score === 1 ? 'text-red-500' :
              strength.score === 2 ? 'text-amber-500' :
              strength.score === 3 ? 'text-blue-500' : 'text-green-600'
            )}>
              {strength.label}
            </p>
          )}
        </div>
      )}

      {/* Rules checklist */}
      {showRules && value && (
        <ul className="mt-2 space-y-1">
          {PASSWORD_RULES.map(rule => {
            const passed = rule.test(value)
            return (
              <li key={rule.label} className="flex items-center gap-1.5">
                {passed
                  ? <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  : <XCircle    className="w-3.5 h-3.5 text-surface-300 flex-shrink-0" />
                }
                <span className={cn('text-xs font-body', passed ? 'text-green-600' : 'text-muted-400')}>
                  {rule.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
