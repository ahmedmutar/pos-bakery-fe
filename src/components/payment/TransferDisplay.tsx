import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, Check, Building2, AlertCircle, FileText } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import { bankApi } from '../../services/bankService'

interface TransferDisplayProps {
  amount: number
  onConfirm: (proof: string) => void
}

export default function TransferDisplay({ amount, onConfirm }: TransferDisplayProps) {
  const [copied, setCopied] = useState<'number' | 'amount' | null>(null)
  const [proof, setProof] = useState('')
  const { data: bank, isLoading } = useQuery({
    queryKey: ['bank-info'],
    queryFn: bankApi.get,
  })

  const copy = (text: string, field: 'number' | 'amount') => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const hasBankInfo = bank?.bankAccount && bank?.bankName

  if (isLoading) {
    return <div className="py-8 text-center font-body text-sm text-muted-400">Memuat info rekening...</div>
  }

  return (
    <div className="space-y-4">
      {!hasBankInfo ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm font-semibold text-amber-700">Info rekening belum diatur</p>
            <p className="font-body text-xs text-amber-600 mt-0.5">
              Minta Owner mengatur info rekening bank di Pengaturan → Bank & Rekening.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-surface-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-muted-500" />
            <p className="font-body text-sm font-medium text-dark-800">{bank.bankName}</p>
          </div>

          {/* Account number */}
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-surface-200">
            <div>
              <p className="font-body text-xs text-muted-400">Nomor Rekening</p>
              <p className="font-mono text-base font-semibold text-dark-800 tracking-wider mt-0.5">
                {bank.bankAccount}
              </p>
              {bank.bankHolder && (
                <p className="font-body text-xs text-muted-400 mt-0.5">a/n {bank.bankHolder}</p>
              )}
            </div>
            <button
              onClick={() => copy(bank.bankAccount!, 'number')}
              className="flex items-center gap-1.5 text-xs font-body font-medium text-muted-500 hover:text-primary-700 transition-colors"
            >
              {copied === 'number'
                ? <><Check className="w-3.5 h-3.5 text-green-500" /> Disalin</>
                : <><Copy className="w-3.5 h-3.5" /> Salin</>}
            </button>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-surface-200">
            <div>
              <p className="font-body text-xs text-muted-400">Jumlah Transfer</p>
              <p className="font-display text-base font-semibold text-dark-800 mt-0.5">
                {formatCurrency(amount)}
              </p>
            </div>
            <button
              onClick={() => copy(String(amount), 'amount')}
              className="flex items-center gap-1.5 text-xs font-body font-medium text-muted-500 hover:text-primary-700 transition-colors"
            >
              {copied === 'amount'
                ? <><Check className="w-3.5 h-3.5 text-green-500" /> Disalin</>
                : <><Copy className="w-3.5 h-3.5" /> Salin</>}
            </button>
          </div>
        </div>
      )}

      {/* Bukti pembayaran */}
      <div>
        <label className="block text-xs font-body font-medium text-primary-700 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Bukti Pembayaran
          <span className="text-muted-400 font-normal">(opsional)</span>
        </label>
        <input
          type="text"
          value={proof}
          onChange={(e) => setProof(e.target.value)}
          placeholder="Nomor referensi, nama pengirim, dll"
          className="input text-sm"
        />
        <p className="font-body text-xs text-muted-400 mt-1">
          Contoh: TRF-20240423, Budi Santoso
        </p>
      </div>

      <button
        onClick={() => onConfirm(proof)}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        Konfirmasi Transfer Masuk
      </button>
    </div>
  )
}
