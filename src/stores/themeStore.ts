import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    // System
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },
    }),
    { name: 'theme-preference' }
  )
)

// Call on app init to apply saved preference
export function initTheme() {
  const saved = localStorage.getItem('theme-preference')
  if (saved) {
    try {
      const { state } = JSON.parse(saved)
      if (state?.theme) applyTheme(state.theme)
    } catch {
      // ignore
    }
  }

  // Watch system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const saved2 = localStorage.getItem('theme-preference')
    if (saved2) {
      try {
        const { state } = JSON.parse(saved2)
        if (state?.theme === 'system') {
          document.documentElement.classList.toggle('dark', e.matches)
        }
      } catch { /* ignore */ }
    }
  })
}
