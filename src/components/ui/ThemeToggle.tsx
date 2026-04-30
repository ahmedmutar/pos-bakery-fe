import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'
import { cn } from '../../lib/utils'

type Theme = 'light' | 'dark' | 'system'

const OPTIONS: { key: Theme; icon: typeof Sun; label: string }[] = [
  { key: 'light',  icon: Sun,     label: 'Terang' },
  { key: 'dark',   icon: Moon,    label: 'Gelap' },
  { key: 'system', icon: Monitor, label: 'Sistem' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="flex bg-surface-100 dark:bg-dark-50 rounded-xl p-1 gap-1">
      {OPTIONS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          title={label}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body font-medium transition-all',
            theme === key
              ? 'bg-white dark:bg-dark-200 text-dark-800 dark:text-surface-100 shadow-warm dark:shadow-dark'
              : 'text-muted-500 dark:text-surface-400 hover:text-primary-700 dark:hover:text-surface-200'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
