/**
 * PublicOrderPage — diakses customer tanpa login
 * URL: /order/:slug
 */
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Loader2, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'
import { formatCurrency, cn } from '../lib/utils'

const PUBLIC_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface PublicVariant { id: string; name: string; price: number; sortOrder: number }
interface PublicProduct {
  id: string
  name: string
  price: number
  imageUrl: string | null
  category: { id: string; name: string } | null
  variants: PublicVariant[]
}
interface TenantInfo { id: string; name: string; slug: string; logoUrl: string | null }

interface CartLine {
  productId: string
  productName: string
  variantId?: string
  variantName?: string
  unitPrice: number
  quantity: number
}

export default function PublicOrderPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-store', slug],
    queryFn: async () => {
      const res = await axios.get(`${PUBLIC_API}/public/${slug}`)
      return res.data as { tenant: TenantInfo; products: PublicProduct[] }
    },
    enabled: !!slug,
    retry: 1,
  })

  const [cart, setCart] = useState<CartLine[]>([])
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [dpAmount, setDpAmount] = useState('')
  const [resellerPhone, setResellerPhone] = useState('')
  const [showResellerInput, setShowResellerInput] = useState(false)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [successOrder, setSuccessOrder] = useState<{
    id: string; customerName: string; total: number; pickupDate: string
    items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[]
  } | null>(null)

  const cartKey = (productId: string, variantId?: string) =>
    variantId ? `${productId}:${variantId}` : productId

  function addToCart(product: PublicProduct, variant?: PublicVariant) {
    const key = cartKey(product.id, variant?.id)
    const unitPrice = variant?.price ?? product.price
    setCart(prev => {
      const existing = prev.find(l => cartKey(l.productId, l.variantId) === key)
      if (existing) {
        return prev.map(l => cartKey(l.productId, l.variantId) === key ? { ...l, quantity: l.quantity + 1 } : l)
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        variantId: variant?.id,
        variantName: variant?.name,
        unitPrice,
        quantity: 1,
      }]
    })
    setExpandedProductId(null)
  }

  function updateQty(productId: string, variantId: string | undefined, delta: number) {
    const key = cartKey(productId, variantId)
    setCart(prev => {
      const updated = prev.map(l =>
        cartKey(l.productId, l.variantId) === key ? { ...l, quantity: l.quantity + delta } : l
      )
      return updated.filter(l => l.quantity > 0)
    })
  }

  function removeFromCart(productId: string, variantId?: string) {
    const key = cartKey(productId, variantId)
    setCart(prev => prev.filter(l => cartKey(l.productId, l.variantId) !== key))
  }

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
  const dpValue = parseInt(dpAmount.replace(/\D/g, '') || '0')
  const minPickupDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (cart.length === 0) return setSubmitError('Keranjang kosong')
    if (!customerName.trim()) return setSubmitError('Nama tidak boleh kosong')
    if (!customerPhone.trim()) return setSubmitError('Nomor HP tidak boleh kosong')
    if (!pickupDate) return setSubmitError('Pilih tanggal pengambilan')
    if (dpValue > subtotal) return setSubmitError('DP tidak boleh melebihi total')

    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await axios.post(`${PUBLIC_API}/public/${slug}/orders`, {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        pickupDate: `${pickupDate}T${pickupTime}:00`,
        dpAmount: dpValue || undefined,
        notes: notes.trim() || undefined,
        resellerPhone: resellerPhone.trim() || undefined,
        items: cart.map(l => ({
          productId: l.productId,
          variantId: l.variantId || undefined,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      })
      setSuccessOrder(res.data)
      setCart([])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setSubmitError(msg ?? 'Gagal mengirim pesanan. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-surface-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-8 h-8 text-muted-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-dark-800 mb-2">Toko tidak ditemukan</h1>
          <p className="font-body text-sm text-muted-400">Link order tidak valid atau toko tidak aktif.</p>
        </div>
      </div>
    )
  }

  const { tenant, products } = data

  // Group products by category
  const categories = Array.from(
    new Map(products.filter(p => p.category).map(p => [p.category!.id, p.category!])).values()
  )
  const uncategorized = products.filter(p => !p.category)

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successOrder) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-5">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-dark-800">Pesanan Diterima!</h2>
            <p className="font-body text-sm text-muted-400 mt-1">
              Terima kasih, {successOrder.customerName}!
            </p>
            <p className="font-body text-xs text-muted-400">
              ID: #{successOrder.id.slice(-8).toUpperCase()}
            </p>
          </div>

          <div className="bg-surface-50 rounded-xl p-4 space-y-2">
            {successOrder.items.map((item, i) => (
              <div key={i} className="flex justify-between font-body text-sm">
                <span className="text-dark-700">{item.productName} ×{item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between font-display text-base font-bold text-dark-800 pt-2 border-t border-surface-200">
              <span>Total</span>
              <span>{formatCurrency(successOrder.total)}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <p className="font-body text-xs text-amber-700">
              Pengambilan:{' '}
              <strong>
                {new Date(successOrder.pickupDate).toLocaleDateString('id-ID', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </strong>
            </p>
            <p className="font-body text-xs text-amber-600 mt-1">
              Toko kami akan segera menghubungi Anda untuk konfirmasi.
            </p>
          </div>

          <button
            onClick={() => setSuccessOrder(null)}
            className="w-full py-3 rounded-xl bg-primary-600 text-white font-body font-semibold hover:bg-primary-700 transition-colors"
          >
            Buat Pesanan Baru
          </button>
        </div>
      </div>
    )
  }

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Store header */}
      <div className="bg-primary-700 text-white px-4 py-5 text-center">
        {tenant.logoUrl && (
          <img src={tenant.logoUrl} alt={tenant.name} className="w-14 h-14 rounded-xl object-contain mx-auto mb-3 bg-white/20 p-1" />
        )}
        <h1 className="font-display text-2xl font-bold">{tenant.name}</h1>
        <p className="font-body text-sm text-primary-200 mt-1">Pre-Order Online</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Product catalog */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-dark-800">Pilih Produk</h2>
          {[
            ...categories.map(cat => ({
              label: cat.name,
              items: products.filter(p => p.category?.id === cat.id),
            })),
            ...(uncategorized.length > 0 ? [{ label: 'Lainnya', items: uncategorized }] : []),
          ].map(group => (
            <div key={group.label}>
              <p className="font-body text-xs font-semibold text-muted-400 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.items.map(product => {
                  const inCart = cart.filter(l => l.productId === product.id)
                  const totalQty = inCart.reduce((s, l) => s + l.quantity, 0)
                  const hasVariants = product.variants.length > 0
                  const isExpanded = expandedProductId === product.id

                  return (
                    <div key={product.id} className="bg-white rounded-xl border border-surface-200 overflow-hidden">
                      <div className="flex items-center gap-3 p-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-surface-100 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-semibold text-dark-800">{product.name}</p>
                          <p className="font-mono text-sm text-primary-600 font-medium">
                            {hasVariants ? `ab ${formatCurrency(Math.min(...product.variants.map(v => v.price)))}` : formatCurrency(product.price)}
                          </p>
                        </div>
                        {totalQty > 0 && (
                          <span className="bg-primary-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                            {totalQty}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            if (hasVariants) {
                              setExpandedProductId(isExpanded ? null : product.id)
                            } else {
                              addToCart(product)
                            }
                          }}
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                            hasVariants
                              ? 'bg-surface-100 text-muted-600 hover:bg-surface-200'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          )}
                        >
                          {hasVariants
                            ? isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            : <Plus className="w-4 h-4" />
                          }
                        </button>
                      </div>

                      {/* Variant picker */}
                      {hasVariants && isExpanded && (
                        <div className="border-t border-surface-100 px-3 pb-3 pt-2 space-y-1.5">
                          <p className="font-body text-xs text-muted-400 mb-2">Pilih varian:</p>
                          {product.variants.sort((a, b) => a.sortOrder - b.sortOrder).map(v => {
                            const lineInCart = cart.find(l => l.productId === product.id && l.variantId === v.id)
                            return (
                              <div key={v.id} className="flex items-center justify-between">
                                <div>
                                  <span className="font-body text-sm text-dark-700">{v.name}</span>
                                  <span className="font-mono text-xs text-muted-500 ml-2">{formatCurrency(v.price)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {lineInCart ? (
                                    <>
                                      <button onClick={() => updateQty(product.id, v.id, -1)} className="w-6 h-6 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200">
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="font-mono text-sm w-4 text-center">{lineInCart.quantity}</span>
                                      <button onClick={() => updateQty(product.id, v.id, 1)} className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700">
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <button onClick={() => addToCart(product, v)} className="px-3 py-1 rounded-lg bg-primary-600 text-white text-xs font-body hover:bg-primary-700">
                                      Tambah
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Cart summary */}
        {cart.length > 0 && (
          <div className="bg-white rounded-xl border border-surface-200 p-4 space-y-3">
            <h3 className="font-display text-base font-semibold text-dark-800">Pesanan Kamu</h3>
            <div className="space-y-2">
              {cart.map(line => {
                const key = cartKey(line.productId, line.variantId)
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-dark-700 truncate">
                        {line.productName}{line.variantName ? ` · ${line.variantName}` : ''}
                      </p>
                      <p className="font-mono text-xs text-muted-500">{formatCurrency(line.unitPrice)} / pcs</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(line.productId, line.variantId, -1)} className="w-6 h-6 rounded-lg bg-surface-100 flex items-center justify-center hover:bg-surface-200">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-sm w-5 text-center font-medium">{line.quantity}</span>
                      <button onClick={() => updateQty(line.productId, line.variantId, 1)} className="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-body text-sm font-semibold text-dark-800 w-20 text-right">
                      {formatCurrency(line.unitPrice * line.quantity)}
                    </p>
                    <button onClick={() => removeFromCart(line.productId, line.variantId)} className="text-muted-300 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between font-display text-lg font-bold text-dark-800 pt-2 border-t border-surface-100">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        )}

        {/* Order form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-surface-200 p-4 space-y-4">
          <h3 className="font-display text-base font-semibold text-dark-800">Data Pemesan</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Nama Lengkap *</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="input" placeholder="Nama kamu" required />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Nomor HP / WA *</label>
              <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="input" placeholder="08xxxxxxxxxx" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Tanggal Pengambilan *</label>
              <input type="date" value={pickupDate} min={minPickupDate} onChange={e => setPickupDate(e.target.value)} className="input" required />
            </div>
            <div>
              <label className="block text-xs font-body font-medium text-primary-700 mb-1">Jam Pengambilan</label>
              <input type="time" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1">Catatan (opsional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input resize-none" placeholder="Catatan tambahan..." />
          </div>

          <div>
            <label className="block text-xs font-body font-medium text-primary-700 mb-1">
              Uang Muka / DP (opsional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-400">Rp</span>
              <input
                type="text"
                value={dpAmount}
                onChange={e => setDpAmount(e.target.value.replace(/\D/g, ''))}
                className="input pl-9"
                placeholder="0"
              />
            </div>
            {dpValue > 0 && subtotal > 0 && (
              <p className="font-body text-xs text-muted-400 mt-1">
                Sisa: {formatCurrency(Math.max(0, subtotal - dpValue))}
              </p>
            )}
          </div>

          {/* Reseller code toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowResellerInput(!showResellerInput)}
              className="flex items-center gap-1.5 text-xs font-body text-muted-500 hover:text-primary-600 transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              {showResellerInput ? 'Sembunyikan kode reseller' : 'Punya kode reseller/agen?'}
            </button>
            {showResellerInput && (
              <div className="mt-2">
                <input
                  type="tel"
                  value={resellerPhone}
                  onChange={e => setResellerPhone(e.target.value)}
                  className="input text-sm py-2"
                  placeholder="No. HP reseller / agen"
                />
              </div>
            )}
          </div>

          {submitError && (
            <p className="font-body text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-body font-semibold text-base hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingCart className="w-5 h-5" /> Kirim Pesanan</>}
          </button>
        </form>

        <p className="text-center font-body text-xs text-muted-400 pb-6">
          Powered by <span className="font-semibold text-primary-600">Sajiin</span>
        </p>
      </div>
    </div>
  )
}
