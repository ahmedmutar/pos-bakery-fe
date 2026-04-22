import { useEffect, useState } from 'react'
import { QrCode, CheckCircle, Clock } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

interface QRISDisplayProps {
  amount: number
  orderId: string
  onSuccess: () => void
  onExpire: () => void
}

// Simple QR-like pattern for simulation
function SimulatedQR({ value }: { value: string }) {
  // Generate deterministic pattern from value
  const seed = value.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const size = 21
  const cells: boolean[][] = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => {
      // Fixed finder patterns at corners
      const inTopLeft = row < 7 && col < 7
      const inTopRight = row < 7 && col > size - 8
      const inBottomLeft = row > size - 8 && col < 7
      if (inTopLeft || inTopRight || inBottomLeft) {
        const r = row % 7
        const c = col % 7
        return (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
      }
      // Data area — pseudo-random from seed
      return ((seed * (row + 1) * (col + 1) * 37) % 7) > 3
    })
  )

  return (
    <div
      className="bg-white p-3 rounded-xl inline-block"
      style={{ imageRendering: 'pixelated' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, 7px)`,
          gap: '1px',
        }}
      >
        {cells.flat().map((filled, i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              backgroundColor: filled ? '#2c1e15' : 'white',
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default function QRISDisplay({ amount, orderId, onSuccess, onExpire }: QRISDisplayProps) {
  const [secondsLeft, setSecondsLeft] = useState(300) // 5 min
  const [simStatus, setSimStatus] = useState<'waiting' | 'success'>('waiting')

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer)
          onExpire()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onExpire])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const pct = (secondsLeft / 300) * 100

  // Simulation: auto-success after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => {
      setSimStatus('success')
      setTimeout(onSuccess, 1500)
    }, 5000)
    return () => clearTimeout(t)
  }, [onSuccess])

  if (simStatus === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <p className="font-display text-lg font-semibold text-green-700">Pembayaran diterima</p>
        <p className="font-body text-sm text-crust-400">{formatCurrency(amount)}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QRIS Logo */}
      <div className="flex items-center gap-2">
        <QrCode className="w-5 h-5 text-crust-600" />
        <span className="font-display text-base font-semibold text-oven-800">QRIS</span>
      </div>

      {/* QR Code */}
      <SimulatedQR value={orderId} />

      {/* Amount */}
      <div className="text-center">
        <p className="font-body text-xs text-crust-400">Total pembayaran</p>
        <p className="font-display text-2xl font-semibold text-oven-800">{formatCurrency(amount)}</p>
      </div>

      {/* Timer */}
      <div className="w-full">
        <div className="flex justify-between font-body text-xs text-crust-400 mb-1.5">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Berlaku selama</span>
          </div>
          <span className={secondsLeft < 60 ? 'text-red-500 font-semibold' : ''}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
        <div className="w-full h-1.5 bg-dough-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              secondsLeft < 60 ? 'bg-red-400' : 'bg-crust-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Simulation badge */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 w-full text-center">
        <p className="font-body text-xs text-amber-700">
          Mode simulasi · Pembayaran otomatis dikonfirmasi dalam 5 detik
        </p>
      </div>
    </div>
  )
}
