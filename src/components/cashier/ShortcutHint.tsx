import { useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { SHORTCUT_LABELS } from '../../hooks/useCashierShortcuts'

export default function ShortcutHint() {
  const [show, setShow] = useState(false)

  return (
    <>
      <button
        onClick={() => setShow(true)}
        title="Keyboard shortcuts"
        className="flex items-center gap-1.5 text-xs font-body text-muted-400 hover:text-primary-600
                   hover:bg-surface-100 px-2 py-1 rounded-lg transition-colors"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>

      {show && (
        <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-primary-600" />
                <h2 className="font-display text-base font-semibold text-dark-800">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button onClick={() => setShow(false)} className="text-muted-400 hover:text-primary-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-2">
              {SHORTCUT_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="font-body text-sm text-primary-600">{label}</span>
                  <kbd className="font-mono text-xs bg-surface-100 border border-surface-300 text-dark-700
                                  px-2 py-0.5 rounded-lg">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="px-5 pb-4">
              <p className="font-body text-xs text-muted-400 text-center">
                Shortcut aktif saat kursor tidak berada di kolom input
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
