import { useState } from 'react'
import { Copy, Check, Building2 } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

interface TransferDisplayProps {
  amount: number
  onConfirm: () => void
}

const BANKS = [
  { code: 'BCA', number: '1234567890', name: 'Bank Central Asia' },
  { code: 'BNI', number: '0987654321', name: 'Bank Negara Indonesia' },
  { code: 'BRI', number: '1122334455', name: 'Bank Rakyat Indonesia' },
]

export default function TransferDisplay({ amount, onConfirm }: TransferDisplayProps) {
  const [selectedBank, setSelectedBank] = useState(BANKS[0])
  const [copied, setCopied] = useState<'number' | 'amount' | null>(null)

  const copy = (text: string, field: 'number' | 'amount') => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Bank selector */}
      <div>
        <p className="font-body text-xs font-medium text-crust-700 mb-2">Pilih Bank Tujuan</p>
        <div className="grid grid-cols-3 gap-2">
          {BANKS.map((bank) => (
            <button
              key={bank.code}
              onClick={() => setSelectedBank(bank)}
              className={`py-2 rounded-xl text-sm font-body font-semibold border transition-all ${
                selectedBank.code === bank.code
                  ? 'bg-crust-600 text-cream border-crust-600 shadow-warm'
                  : 'bg-dough-50 text-crust-600 border-dough-200 hover:bg-dough-100'
              }`}
            >
              {bank.code}
            </button>
          ))}
        </div>
      </div>

      {/* Transfer details */}
      <div className="bg-dough-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-crust-500" />
          <p className="font-body text-sm font-medium text-oven-800">{selectedBank.name}</p>
        </div>

        {/* Account number */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-dough-200">
          <div>
            <p className="font-body text-xs text-crust-400">Nomor Rekening</p>
            <p className="font-mono text-base font-semibold text-oven-800 tracking-wider mt-0.5">
              {selectedBank.number}
            </p>
          </div>
          <button
            onClick={() => copy(selectedBank.number, 'number')}
            className="flex items-center gap-1.5 text-xs font-body font-medium text-crust-500 hover:text-crust-700 transition-colors"
          >
            {copied === 'number' ? (
              <><Check className="w-3.5 h-3.5 text-green-500" /> Disalin</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Salin</>
            )}
          </button>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-dough-200">
          <div>
            <p className="font-body text-xs text-crust-400">Jumlah Transfer</p>
            <p className="font-display text-base font-semibold text-oven-800 mt-0.5">
              {formatCurrency(amount)}
            </p>
          </div>
          <button
            onClick={() => copy(String(amount), 'amount')}
            className="flex items-center gap-1.5 text-xs font-body font-medium text-crust-500 hover:text-crust-700 transition-colors"
          >
            {copied === 'amount' ? (
              <><Check className="w-3.5 h-3.5 text-green-500" /> Disalin</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Salin</>
            )}
          </button>
        </div>

        <p className="font-body text-xs text-crust-400 text-center">
          Transfer tepat sesuai nominal agar pembayaran terverifikasi otomatis
        </p>
      </div>

      {/* Simulation notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
        <p className="font-body text-xs text-amber-700">
          Mode simulasi · Klik konfirmasi setelah "transfer"
        </p>
      </div>

      <button
        onClick={onConfirm}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        Konfirmasi Transfer Masuk
      </button>
    </div>
  )
}
