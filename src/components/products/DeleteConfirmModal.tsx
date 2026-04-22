import { X, Trash2 } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DeleteConfirmModalProps {
  title: string
  description: string
  isPending?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function DeleteConfirmModal({
  title,
  description,
  isPending,
  onConfirm,
  onClose,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-oven-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="font-display text-lg font-semibold text-oven-800">{title}</h2>
          </div>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="font-body text-sm text-crust-600">{description}</p>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'flex-1 flex items-center justify-center gap-2',
              'bg-red-500 hover:bg-red-600 text-white font-body font-medium',
              'px-5 py-2.5 rounded-xl transition-all',
              isPending && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}
