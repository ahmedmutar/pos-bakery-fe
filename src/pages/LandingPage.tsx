import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, BarChart3, Package, ChefHat,
  Wifi, Shield, Smartphone, CheckCircle,
  ArrowRight, Star, Croissant,
  TrendingUp, FileSpreadsheet,
} from 'lucide-react'

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: 149000,
    period: '/bulan',
    desc: 'Untuk bakery kecil yang baru mulai',
    color: 'border-dough-200',
    badge: null,
    features: [
      '1 outlet',
      'Maksimal 3 staff',
      'Maksimal 50 produk',
      'Kasir + shift management',
      'Laporan penjualan',
      'Pre-order & pesanan',
      'Support email',
    ],
    cta: 'Mulai Gratis 14 Hari',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 349000,
    period: '/bulan',
    desc: 'Untuk bakery yang sedang berkembang',
    color: 'border-crust-500',
    badge: 'Paling Populer',
    features: [
      'Hingga 5 outlet',
      'Hingga 10 staff',
      'Produk tidak terbatas',
      'Semua fitur Basic',
      'Forecast produksi AI',
      'Import data Excel',
      'Manajemen resep & food cost',
      'Support prioritas',
    ],
    cta: 'Coba Pro 14 Hari',
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 0,
    period: 'custom',
    desc: 'Untuk jaringan bakery & franchise',
    color: 'border-oven-700',
    badge: null,
    features: [
      'Outlet tidak terbatas',
      'Staff tidak terbatas',
      'Semua fitur Pro',
      'White label (nama & logo sendiri)',
      'API access',
      'Dedicated support',
      'Onboarding & training',
      'SLA guaranteed',
    ],
    cta: 'Hubungi Kami',
  },
]

const FEATURES = [
  {
    icon: ShoppingCart,
    title: 'Kasir Modern',
    desc: 'Interface kasir yang cepat dengan keyboard shortcuts, offline mode, dan cetak struk thermal.',
  },
  {
    icon: BarChart3,
    title: 'Laporan Real-time',
    desc: 'Dashboard penjualan live, laporan harian, produk terlaris, dan export Excel/PDF.',
  },
  {
    icon: ChefHat,
    title: 'Manajemen Produksi',
    desc: 'Rencana produksi, cek material, catat hasil, dan stok bahan baku otomatis berkurang.',
  },
  {
    icon: TrendingUp,
    title: 'Forecast Produksi',
    desc: 'Saran jumlah produksi berdasarkan histori penjualan. Kurangi waste, tingkatkan profit.',
  },
  {
    icon: Package,
    title: 'Inventaris Lengkap',
    desc: 'Kelola bahan baku, alat, dan kemasan. Notifikasi otomatis saat stok menipis.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Import Excel',
    desc: 'Tambahkan ratusan produk, bahan, dan resep sekaligus lewat upload file Excel.',
  },
  {
    icon: Wifi,
    title: 'Offline Mode',
    desc: 'Kasir tetap berjalan meski internet mati. Transaksi tersinkron otomatis saat online.',
  },
  {
    icon: Smartphone,
    title: 'Semua Perangkat',
    desc: 'Tampil sempurna di desktop, tablet, dan HP. Tidak perlu install aplikasi.',
  },
  {
    icon: Shield,
    title: 'Keamanan Terjamin',
    desc: 'Harga diverifikasi server-side. Token auth, rate limiting, dan enkripsi data.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Sari Dewi',
    role: 'Owner, Sari Bakery Bandung',
    text: 'Sebelum pakai Roti POS, pencatatan masih manual di buku. Sekarang semua terlihat jelas — penjualan, stok, sampai food cost per produk.',
    stars: 5,
  },
  {
    name: 'Budi Santoso',
    role: 'Owner, Roti Mas Budi (3 cabang)',
    text: 'Fitur multi-outlet sangat membantu. Bisa pantau semua cabang dari satu dashboard. Laporan bulanan tinggal export Excel.',
    stars: 5,
  },
  {
    name: 'Dewi Rahayu',
    role: 'Manager, Pastry Corner',
    text: 'Forecast produksi akuratnya bikin saya takjub. Waste turun hampir 30% dalam 2 bulan pertama.',
    stars: 5,
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [billingAnnual, setBillingAnnual] = useState(false)

  const formatPrice = (price: number) => {
    if (price === 0) return 'Custom'
    const final = billingAnnual ? Math.round(price * 0.8) : price
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(final)
  }

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur border-b border-dough-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-crust-600 rounded-xl flex items-center justify-center">
              <Croissant className="w-4 h-4 text-cream" />
            </div>
            <span className="font-display text-lg font-bold text-oven-800">Roti POS</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-body text-crust-600">
            <a href="#features" className="hover:text-crust-800 transition-colors">Fitur</a>
            <a href="#pricing" className="hover:text-crust-800 transition-colors">Harga</a>
            <a href="#testimonials" className="hover:text-crust-800 transition-colors">Testimoni</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn-ghost text-sm py-2">
              Masuk
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-sm py-2 px-4"
            >
              Coba Gratis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-dough-100 border border-dough-300 px-4 py-2 rounded-full text-sm font-body text-crust-700 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Dipercaya 200+ bakery di Indonesia
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold text-oven-800 leading-tight tracking-tight mb-6">
          Sistem Kasir Bakery<br />
          <span className="text-crust-600">yang Benar-benar Paham</span><br />
          Kebutuhan Anda
        </h1>

        <p className="font-body text-xl text-crust-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Dari kasir harian, manajemen resep, hingga forecast produksi — semua dalam satu platform
          yang bisa diakses dari mana saja, bahkan saat offline.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/register')}
            className="btn-primary text-base py-3.5 px-8 flex items-center gap-2 shadow-warm-lg"
          >
            Coba Gratis 14 Hari
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="font-body text-sm text-crust-400">
            Tidak perlu kartu kredit
          </p>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: '200+', label: 'Bakery aktif' },
            { value: '1.2 jt', label: 'Transaksi/bulan' },
            { value: '99.9%', label: 'Uptime' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-3xl font-bold text-crust-700">{value}</p>
              <p className="font-body text-sm text-crust-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-oven-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-cream mb-4 tracking-tight">
              Semua yang Dibutuhkan Bakery
            </h2>
            <p className="font-body text-crust-300 text-lg">
              Satu platform, semua operasional toko terkendali
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-oven-700 rounded-2xl p-6 hover:bg-oven-600 transition-colors">
                <div className="w-10 h-10 bg-crust-600 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-cream" />
                </div>
                <h3 className="font-display text-base font-bold text-cream mb-2">{title}</h3>
                <p className="font-body text-sm text-crust-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-oven-800 mb-4 tracking-tight">
            Harga Transparan, Tanpa Kejutan
          </h2>
          <p className="font-body text-crust-500 text-lg mb-8">
            Mulai gratis 14 hari, tidak perlu kartu kredit
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 bg-dough-100 rounded-xl p-1">
            <button
              onClick={() => setBillingAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                !billingAnnual ? 'bg-white text-oven-800 shadow-warm' : 'text-crust-500'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBillingAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                billingAnnual ? 'bg-white text-oven-800 shadow-warm' : 'text-crust-500'
              }`}
            >
              Tahunan
              <span className="ml-1.5 text-[10px] font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 p-8 bg-white flex flex-col ${plan.color} ${
                plan.badge ? 'shadow-warm-lg' : 'shadow-warm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-crust-600 text-cream text-xs font-body font-semibold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-oven-800 mb-1">{plan.name}</h3>
                <p className="font-body text-sm text-crust-400">{plan.desc}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-oven-800">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="font-body text-sm text-crust-400">{plan.period}</span>
                  )}
                </div>
                {billingAnnual && plan.price > 0 && (
                  <p className="font-body text-xs text-green-600 mt-1">
                    Hemat {formatPrice(plan.price * 12 * 0.2)}/tahun
                  </p>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 font-body text-sm text-crust-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => plan.key === 'enterprise' ? window.open('mailto:sales@rotipos.com') : navigate('/register')}
                className={`w-full py-3 rounded-xl font-body font-semibold text-sm transition-all ${
                  plan.badge
                    ? 'bg-crust-600 text-cream hover:bg-crust-700 shadow-warm'
                    : 'bg-dough-100 text-crust-700 hover:bg-dough-200 border border-dough-300'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-dough-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-oven-800 mb-4 tracking-tight">
              Dipercaya Pemilik Bakery
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, stars }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-warm">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="font-body text-sm text-crust-600 leading-relaxed mb-4 italic">
                  "{text}"
                </p>
                <div>
                  <p className="font-body text-sm font-semibold text-oven-800">{name}</p>
                  <p className="font-body text-xs text-crust-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-display text-4xl font-bold text-oven-800 mb-4 tracking-tight">
          Siap Digitalkan Bakery Anda?
        </h2>
        <p className="font-body text-lg text-crust-500 mb-8">
          Bergabung dengan 200+ bakery yang sudah lebih efisien bersama Roti POS.
          Trial 14 hari gratis, tidak perlu kartu kredit.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="btn-primary text-base py-4 px-10 flex items-center gap-2 mx-auto shadow-warm-lg"
        >
          Mulai Trial Gratis
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-oven-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-crust-600 rounded-xl flex items-center justify-center">
                <Croissant className="w-3.5 h-3.5 text-cream" />
              </div>
              <span className="font-display text-base font-bold text-cream">Roti POS</span>
            </div>
            <div className="flex items-center gap-6 text-sm font-body text-crust-300">
              <a href="mailto:hello@rotipos.com" className="hover:text-cream transition-colors">
                hello@rotipos.com
              </a>
              <a href="#" className="hover:text-cream transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-cream transition-colors">Syarat & Ketentuan</a>
            </div>
            <p className="font-body text-xs text-crust-400">
              © {new Date().getFullYear()} Roti POS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
