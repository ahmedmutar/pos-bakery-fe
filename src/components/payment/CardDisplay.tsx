import { useState } from 'react'
import { CreditCard, Lock, Check, Loader2 } from 'lucide-react'
import { formatCurrency, cn } from '../../lib/utils'

interface CardDisplayProps {
  amount: number
  onSuccess: () => void
}

export default function CardDisplay({ amount, onSuccess }: CardDisplayProps) {
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }

  const isValid = cardNumber.replace(/\s/g, '').length === 16
    && expiry.length === 5
    && cvv.length >= 3
    && name.trim().length > 0

  const handleCharge = async () => {
    setError('')
    setProcessing(true)

    // Simulation: reject if card number starts with 4000
    await new Promise((r) => setTimeout(r, 2000))

    const digits = cardNumber.replace(/\s/g, '')
    if (digits.startsWith('4000')) {
      setError('Kartu ditolak. Gunakan nomor kartu lain.')
      setProcessing(false)
      return
    }

    setProcessing(false)
    onSuccess()
  }

  return (
    <div className="space-y-4">
      {/* Card preview */}
      <div className="bg-gradient-to-br from-oven-800 to-crust-700 rounded-2xl p-5 text-cream shadow-warm-lg">
        <div className="flex justify-between items-start mb-6">
          <CreditCard className="w-8 h-8 opacity-70" />
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded-full bg-red-400 opacity-80" />
            <div className="w-6 h-6 rounded-full bg-amber-400 opacity-80 -ml-3" />
          </div>
        </div>
        <p className="font-mono text-lg tracking-widest mb-4">
          {cardNumber || '•••• •••• •••• ••••'}
        </p>
        <div className="flex justify-between items-end">
          <div>
            <p className="font-body text-xs opacity-60 mb-0.5">Nama</p>
            <p className="font-body text-sm font-medium uppercase">
              {name || 'NAMA KARTU'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-body text-xs opacity-60 mb-0.5">Berlaku hingga</p>
            <p className="font-body text-sm font-medium">{expiry || 'MM/YY'}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
            Nomor Kartu
          </label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            className="input font-mono text-sm tracking-wider"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
              Berlaku Hingga
            </label>
            <input
              type="text"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              maxLength={5}
              className="input font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
              CVV
            </label>
            <div className="relative">
              <input
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="•••"
                maxLength={4}
                className="input font-mono text-sm pr-9"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-crust-300" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
            Nama di Kartu
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="NAMA LENGKAP"
            className="input font-mono text-sm uppercase"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-body px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Simulation hint */}
      <div className="bg-dough-50 border border-dough-200 rounded-xl px-4 py-2.5">
        <p className="font-body text-xs text-crust-500">
          Mode simulasi · Gunakan nomor kartu apapun kecuali yang diawali <span className="font-mono font-medium">4000</span> (akan ditolak)
        </p>
      </div>

      <button
        onClick={handleCharge}
        disabled={!isValid || processing}
        className={cn(
          'w-full flex items-center justify-center gap-2',
          'bg-crust-600 hover:bg-crust-700 text-cream font-body font-medium',
          'px-5 py-3 rounded-xl transition-all shadow-warm',
          (!isValid || processing) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {processing ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
        ) : (
          <><Check className="w-4 h-4" /> Bayar {formatCurrency(amount)}</>
        )}
      </button>
    </div>
  )
}
