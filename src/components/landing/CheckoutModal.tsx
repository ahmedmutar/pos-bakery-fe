import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Loader2, ShoppingBag, ArrowRight } from 'lucide-react'
import api from '../../lib/api'

const PLAN_INFO = {
  basic:      { label: 'Basic',      price: 149_000, color: 'border-dough-300' },
  pro:        { label: 'Pro',        price: 349_000, color: 'border-crust-400' },
  enterprise: { label: 'Enterprise', price: 999_000, color: 'border-oven-500' },
}

interface CheckoutModalProps {
  plan: 'basic' | 'pro' | 'enterprise'
  onClose: () => void
}

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function CheckoutModal({ plan, onClose }: CheckoutModalProps) {
  const info = PLAN_INFO[plan]
  const [form, setForm] = useState({ name: '', email: '', storeName: '', phone: '' })

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/billing/checkout/guest', { plan, ...form })
      return res.data as { invoiceUrl: string }
    },
    onSuccess: (data) => {
      window.open(data.invoiceUrl, '_blank')
      onClose()
    },
  })

  const valid = form.name.length >= 2 && form.email.includes('@') && form.storeName.length >= 2

  return (
    <div className="fixed inset-0 bg-oven-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-warm-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dough-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-crust-600" />
            <div>
              <h2 className="font-display text-base font-semibold text-oven-800">
                Beli Paket {info.label}
              </h2>
              <p className="font-body text-xs text-crust-400">{formatRp(info.price)}/bulan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-crust-400 hover:text-crust-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="bg-dough-50 border border-dough-200 rounded-xl px-4 py-3">
            <p className="font-body text-xs text-crust-500">
              Isi data di bawah, lalu Anda akan diarahkan ke halaman pembayaran Xendit. 
              Setelah pembayaran berhasil, akun akan langsung aktif.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">Nama Anda *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ahmad Mukhtar"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">Nama Toko *</label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm(f => ({ ...f, storeName: e.target.value }))}
                placeholder="Bakery Enak"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@toko.com"
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-crust-700 mb-1.5">
              Nomor WhatsApp <span className="text-crust-400 font-normal">(opsional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="0812xxxxxxxx"
              className="input"
            />
          </div>

          {mutation.isError && (
            <p className="font-body text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">
              Gagal membuat invoice. Coba lagi atau hubungi kami via WhatsApp.
            </p>
          )}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Batal</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !valid}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ArrowRight className="w-4 h-4" />
            }
            Lanjut Bayar {formatRp(info.price)}
          </button>
        </div>
      </div>
    </div>
  )
}
