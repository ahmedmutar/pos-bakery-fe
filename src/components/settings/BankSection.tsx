import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Landmark, Loader2, CheckCircle } from 'lucide-react'
import { bankApi } from '../../services/bankService'

const BANK_OPTIONS = [
  'BCA', 'BRI', 'BNI', 'Mandiri', 'CIMB Niaga',
  'Danamon', 'Permata', 'BSI', 'BTN', 'Jenius',
  'SeaBank', 'GoPay', 'OVO', 'Dana', 'Lainnya',
]

export default function BankSection() {
  const qc = useQueryClient()
  const { data: bank } = useQuery({ queryKey: ['bank-info'], queryFn: bankApi.get })

  const [bankName, setBankName] = useState('')
  const [customBank, setCustomBank] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankHolder, setBankHolder] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!bank) return
    const isCustom = bank.bankName && !BANK_OPTIONS.slice(0, -1).includes(bank.bankName)
    setBankName(isCustom ? 'Lainnya' : (bank.bankName ?? ''))
    setCustomBank(isCustom ? (bank.bankName ?? '') : '')
    setBankAccount(bank.bankAccount ?? '')
    setBankHolder(bank.bankHolder ?? '')
  }, [bank])

  const mutation = useMutation({
    mutationFn: () => bankApi.update({
      bankName: bankName === 'Lainnya' ? customBank.trim() : bankName,
      bankAccount: bankAccount.trim(),
      bankHolder: bankHolder.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-info'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <Landmark className="w-5 h-5 text-primary-600" />
        <h2 className="font-display text-base font-semibold text-dark-800">Info Rekening Bank</h2>
      </div>
      <p className="font-body text-sm text-muted-400">
        Ditampilkan kepada pelanggan saat memilih metode pembayaran Transfer Bank.
      </p>

      <div className="space-y-4">
        {/* Bank name */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
            Nama Bank
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="input"
          >
            <option value="">-- Pilih bank --</option>
            {BANK_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          {bankName === 'Lainnya' && (
            <input
              type="text"
              value={customBank}
              onChange={(e) => setCustomBank(e.target.value)}
              placeholder="Nama bank lainnya"
              className="input mt-2"
            />
          )}
        </div>

        {/* Account number */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
            Nomor Rekening
          </label>
          <input
            type="text"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ''))}
            placeholder="1234567890"
            className="input font-mono tracking-widest"
            maxLength={20}
          />
        </div>

        {/* Account holder */}
        <div>
          <label className="block text-xs font-body font-medium text-primary-700 mb-1.5">
            Nama Pemilik Rekening
          </label>
          <input
            type="text"
            value={bankHolder}
            onChange={(e) => setBankHolder(e.target.value)}
            placeholder="Ahmad Mukhtar"
            className="input"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {mutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved
            ? <CheckCircle className="w-4 h-4" />
            : null
          }
          {saved ? 'Tersimpan!' : 'Simpan'}
        </button>
        {bank?.bankAccount && (
          <p className="font-body text-xs text-muted-400">
            Saat ini: {bank.bankName} · {bank.bankAccount} · {bank.bankHolder}
          </p>
        )}
      </div>
    </div>
  )
}
