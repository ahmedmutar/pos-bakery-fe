import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Croissant, Store, Package, ShoppingCart,
  CheckCircle, ArrowRight, Loader2,
} from 'lucide-react'
import { settingsApi } from '../../services/settingsService'
import { productApi } from '../../services/productService'
import { categoryApi } from '../../services/categoryService'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../lib/utils'

interface OnboardingWizardProps {
  onComplete: () => void
}

const STEPS = [
  { id: 'welcome',  label: 'Selamat datang', icon: Croissant },
  { id: 'store',    label: 'Profil toko',    icon: Store },
  { id: 'product',  label: 'Produk pertama', icon: Package },
  { id: 'done',     label: 'Siap!',          icon: CheckCircle },
]

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState(0)

  // Step 2 — store name
  const [storeName, setStoreName] = useState(user?.tenantName ?? '')

  // Step 3 — first product
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productCategory, setProductCategory] = useState('Roti')

  const updateStore = useMutation({
    mutationFn: () => settingsApi.updateProfile(storeName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings-profile'] })
      setStep(2)
    },
  })

  const createProduct = useMutation({
    mutationFn: async () => {
      // Create category first
      const cat = await categoryApi.create(productCategory)
      return productApi.create({
        name: productName.trim(),
        price: parseInt(productPrice.replace(/\D/g, '')),
        categoryId: cat.id,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      setStep(3)
    },
  })

  const skipProduct = () => setStep(3)

  return (
    <div className="fixed inset-0 bg-oven-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-warm-lg w-full max-w-[95vw] sm:max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-dough-100">
          <div
            className="h-full bg-crust-600 transition-all duration-500 rounded-full"
            style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between px-8 pt-6 pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'bg-crust-600 text-cream shadow-warm' :
                  'bg-dough-100 text-crust-300'
                )}>
                  {i < step
                    ? <CheckCircle className="w-5 h-5" />
                    : <Icon className="w-5 h-5" />
                  }
                </div>
                <span className={cn(
                  'font-body text-[10px]',
                  i === step ? 'text-crust-700 font-medium' : 'text-crust-300'
                )}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-crust-100 rounded-3xl flex items-center justify-center mx-auto">
                <Croissant className="w-10 h-10 text-crust-600" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-oven-800 mb-2">
                  Selamat datang di Roti POS!
                </h2>
                <p className="font-body text-sm text-crust-500 leading-relaxed">
                  Halo, <strong>{user?.name}</strong>! Mari setup toko Anda dalam 2 menit.
                  Kami akan bantu Anda mengatur profil toko dan menambahkan produk pertama.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: Store, label: 'Profil toko' },
                  { icon: Package, label: 'Produk' },
                  { icon: ShoppingCart, label: 'Kasir siap' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="bg-dough-50 rounded-xl p-3 text-center">
                    <Icon className="w-5 h-5 text-crust-500 mx-auto mb-1" />
                    <p className="font-body text-xs text-crust-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Store name ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-oven-800 mb-1">
                  Nama toko Anda
                </h2>
                <p className="font-body text-sm text-crust-500">
                  Nama ini akan muncul di struk dan tampilan kasir.
                </p>
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
                  Nama Toko
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Bakery Sejahtera"
                  className="input text-lg"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && storeName.trim()) updateStore.mutate() }}
                />
              </div>

              {updateStore.isError && (
                <p className="text-red-500 text-sm font-body">Gagal menyimpan. Coba lagi.</p>
              )}
            </div>
          )}

          {/* ── Step 2: First product ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-oven-800 mb-1">
                  Tambah produk pertama
                </h2>
                <p className="font-body text-sm text-crust-500">
                  Produk bisa ditambah lebih banyak nanti dari menu Produk.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Croissant Butter"
                    className="input"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
                      Harga (Rp)
                    </label>
                    <input
                      type="text"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value.replace(/\D/g, ''))}
                      placeholder="15000"
                      className="input font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-crust-700 mb-1.5">
                      Kategori
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="input"
                    >
                      {['Roti', 'Kue', 'Pastry', 'Minuman', 'Lainnya'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {createProduct.isError && (
                <p className="text-red-500 text-sm font-body">Gagal menambah produk. Coba lagi.</p>
              )}
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-oven-800 mb-2">
                  Toko siap beroperasi!
                </h2>
                <p className="font-body text-sm text-crust-500 leading-relaxed">
                  Setup selesai. Anda bisa langsung buka shift dan mulai mencatat transaksi.
                  Tambah lebih banyak produk, bahan baku, dan resep dari menu di sidebar.
                </p>
              </div>

              <div className="bg-dough-50 rounded-xl p-4 text-left space-y-2">
                <p className="font-body text-xs font-semibold text-crust-600 uppercase tracking-wide">
                  Langkah selanjutnya
                </p>
                {[
                  'Buka menu Kasir → Buka Shift → mulai transaksi',
                  'Tambah produk lainnya di menu Produk',
                  'Input bahan baku di menu Inventaris',
                  'Buat resep untuk kalkulasi food cost',
                ].map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 text-crust-400 flex-shrink-0 mt-0.5" />
                    <p className="font-body text-xs text-crust-600">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-8 pb-8 flex gap-3">
          {/* Skip / Back */}
          {step === 2 && (
            <button onClick={skipProduct} className="btn-secondary flex-1">
              Lewati
            </button>
          )}

          {/* Primary action */}
          {step === 0 && (
            <button onClick={() => setStep(1)} className="btn-primary flex-1 flex items-center justify-center gap-2">
              Mulai Setup
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 1 && (
            <button
              onClick={() => updateStore.mutate()}
              disabled={!storeName.trim() || updateStore.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {updateStore.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Lanjut
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => createProduct.mutate()}
              disabled={!productName.trim() || !productPrice || createProduct.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {createProduct.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Tambah Produk
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button onClick={onComplete} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Mulai Gunakan Roti POS
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
