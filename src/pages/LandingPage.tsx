import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CheckoutModal from '../components/landing/CheckoutModal'
import { SajiinIcon } from '../components/ui/SajiinLogo'
import {
  ShoppingCart, BarChart3, Package, ChefHat,
  Wifi, Shield, Smartphone, CheckCircle,
  ArrowRight, Star, TrendingUp, FileSpreadsheet,
  MessageCircle, Menu, X, Zap, Clock, Users,
  Receipt, Calculator, Bell, LayoutDashboard,
  ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── DATA ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    key: 'basic', name: 'Basic', price: 149000, period: '/bulan',
    desc: 'Untuk bisnis yang baru mulai',
    badge: null, highlight: false,
    features: ['1 outlet', 'Maks. 3 staff', 'Maks. 50 produk', 'Kasir + shift', 'Laporan penjualan', 'Pre-order & pesanan', 'Support email'],
  },
  {
    key: 'pro', name: 'Pro', price: 349000, period: '/bulan',
    desc: 'Untuk bisnis yang sedang berkembang',
    badge: 'Paling Populer', highlight: true,
    features: ['Hingga 5 outlet', 'Hingga 10 staff', 'Produk tak terbatas', 'Semua fitur Basic', 'Forecast produksi', 'Import Excel', 'Resep & food cost', 'Support prioritas'],
  },
  {
    key: 'enterprise', name: 'Enterprise', price: 0, period: 'custom',
    desc: 'Untuk jaringan & franchise',
    badge: null, highlight: false,
    features: ['Outlet tak terbatas', 'Staff tak terbatas', 'Semua fitur Pro', 'White label', 'API access', 'Dedicated support', 'Onboarding & training', 'SLA guaranteed'],
  },
]

const FEATURES = [
  { icon: ShoppingCart, title: 'Kasir Cepat', desc: 'Interface ringan dengan keyboard shortcuts & offline mode. Bayar tunai, QRIS, atau transfer bank.' },
  { icon: BarChart3,    title: 'Laporan Instan', desc: 'Dashboard live, laporan harian, produk terlaris, laba rugi — semua bisa export Excel/PDF.' },
  { icon: ChefHat,      title: 'Kelola Produksi', desc: 'Rencana produksi harian, catat hasil & waste, stok bahan baku otomatis berkurang.' },
  { icon: TrendingUp,   title: 'Forecast Pintar', desc: 'Saran jumlah produksi dari histori penjualan. Waste turun, profit naik.' },
  { icon: Package,      title: 'Inventaris Lengkap', desc: 'Kelola bahan baku & kemasan. Notifikasi otomatis saat stok hampir habis.' },
  { icon: FileSpreadsheet, title: 'Import Excel', desc: 'Tambah ratusan produk, bahan, dan resep sekaligus via upload file.' },
  { icon: Wifi,         title: 'Offline Mode', desc: 'Kasir tetap jalan meski internet mati. Sinkron otomatis saat kembali online.' },
  { icon: Smartphone,   title: 'Semua Perangkat', desc: 'Buka dari HP, tablet, atau laptop. Tidak perlu install aplikasi apapun.' },
  { icon: Shield,       title: 'Aman & Terpercaya', desc: 'Data terenkripsi, auth JWT, rate limiting. Uptime 99.9% dijamin.' },
]

const TESTIMONIALS = [
  { name: 'Sari Dewi', role: 'Owner, Sari Kuliner Bandung', stars: 5, avatar: 'SD', text: 'Sebelum pakai Sajiin, pencatatan masih manual di buku. Sekarang semua terlihat jelas — penjualan, stok, sampai food cost per produk. Benar-benar mengubah cara saya kelola bisnis.' },
  { name: 'Budi Santoso', role: 'Owner, Warung Mas Budi (3 cabang)', stars: 5, avatar: 'BS', text: 'Fitur multi-outlet sangat membantu. Bisa pantau semua cabang dari satu dashboard. Laporan bulanan tinggal export Excel, tidak perlu rekap manual lagi.' },
  { name: 'Dewi Rahayu', role: 'Manager, Pastry Corner', stars: 5, avatar: 'DR', text: 'Forecast produksinya bikin saya takjub. Waste turun hampir 30% dalam 2 bulan pertama. Tim produksi jadi lebih terencana dan tidak panik lagi.' },
  { name: 'Ahmad Fauzi', role: 'Owner, Nasi Goreng Pak Ahmad', stars: 5, avatar: 'AF', text: 'Saya tidak punya background teknologi tapi Sajiin mudah banget dipelajari. Dalam 1 hari langsung bisa pakai. Support-nya juga responsif dan ramah.' },
  { name: 'Rina Marlina', role: 'Owner, Katering Bu Rina', stars: 5, avatar: 'RM', text: 'Fitur pre-order sangat membantu bisnis katering saya. Semua pesanan tercatat rapi, uang muka dan pelunasan terpantau. Tidak ada lagi pesanan yang terlewat.' },
  { name: 'Hendra Wijaya', role: 'Founder, Kedai Hendra Group', stars: 5, avatar: 'HW', text: 'Dari 1 outlet sekarang sudah 4. Semua dikelola dari satu akun Sajiin. Dashboard laporan laba rugi per outlet sangat membantu keputusan bisnis saya.' },
]

const STEPS = [
  { no: '01', icon: Users, title: 'Daftar gratis', desc: 'Buat akun dalam 2 menit. Verifikasi email, langsung masuk dashboard.' },
  { no: '02', icon: LayoutDashboard, title: 'Setup toko', desc: 'Tambahkan produk, atur staf, dan konfigurasi outlet Anda.' },
  { no: '03', icon: Zap, title: 'Langsung pakai', desc: 'Buka kasir dan mulai transaksi hari ini. Semua data tersimpan otomatis.' },
]

const FAQS = [
  { q: 'Apakah bisa digunakan tanpa internet?', a: 'Ya. Fitur kasir mendukung mode offline — transaksi tetap bisa dicatat meski internet terputus. Data akan tersinkron otomatis saat koneksi pulih.' },
  { q: 'Perangkat apa saja yang didukung?', a: 'Sajiin berbasis web sehingga bisa diakses dari browser di laptop, tablet, maupun HP. Tidak perlu install aplikasi. Direkomendasikan Chrome atau Safari terbaru.' },
  { q: 'Bagaimana cara upgrade paket?', a: 'Bisa upgrade langsung dari menu Billing di dalam aplikasi. Pembayaran via Xendit: transfer bank, QRIS, GoPay, OVO, Dana, kartu kredit. Akun langsung aktif setelah bayar.' },
  { q: 'Apakah data saya aman?', a: 'Data disimpan di server terenkripsi dengan koneksi HTTPS. Data operasional toko sepenuhnya milik Anda — kami tidak menjual atau berbagi ke pihak ketiga.' },
  { q: 'Bisa coba dulu sebelum bayar?', a: 'Tentu. Semua akun baru dapat trial gratis 14 hari tanpa kartu kredit. Anda bisa mencoba seluruh fitur selama periode trial.' },
  { q: 'Apakah ada biaya setup atau tersembunyi?', a: 'Tidak ada. Harga yang tertera sudah all-in. Tidak ada biaya setup, biaya onboarding, atau biaya per transaksi.' },
]

const METRICS = [
  { icon: Receipt,    label: 'Transaksi diproses', value: '12rb+', sub: 'setiap bulan' },
  { icon: Users,      label: 'Bisnis aktif',        value: '200+',  sub: 'di Indonesia' },
  { icon: Clock,      label: 'Waktu setup',          value: '2 mnt', sub: 'rata-rata' },
  { icon: Calculator, label: 'Waste berkurang',      value: '30%',   sub: 'rata-rata pengguna' },
]

const PAIN_POINTS = [
  { before: 'Pencatatan manual di buku, rawan salah hitung', after: 'Kasir digital otomatis, laporan real-time' },
  { before: 'Tidak tahu stok bahan baku tersisa berapa', after: 'Notifikasi otomatis saat stok menipis' },
  { before: 'Susah pantau penjualan beberapa cabang', after: 'Dashboard multi-outlet dalam satu layar' },
  { before: 'Waste produksi tinggi, profit tidak maksimal', after: 'Forecast pintar, produksi lebih terencana' },
]

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCountUp(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(ease * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return count
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const [checkoutPlan, setCheckoutPlan] = useState<'basic' | 'pro' | 'enterprise' | null>(null)
  const [billingAnnual, setBillingAnnual] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activePain, setActivePain] = useState(0)

  const { ref: statsRef, inView: statsVisible } = useInView()
  const c1 = useCountUp(200, 1800, statsVisible)
  const c2 = useCountUp(12, 1800, statsVisible)
  const c3 = useCountUp(30, 1800, statsVisible)

  // Auto-rotate pain points
  useEffect(() => {
    const t = setInterval(() => setActivePain(p => (p + 1) % PAIN_POINTS.length), 3000)
    return () => clearInterval(t)
  }, [])

  const formatPrice = (p: number) => {
    if (p === 0) return 'Custom'
    return 'Rp ' + (billingAnnual ? Math.round(p * 0.8) : p).toLocaleString('id-ID')
  }

  return (
    <div className="min-h-screen bg-white font-body overflow-x-hidden">
      <style>{`
        @keyframes fadeUp    { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeLeft  { from { opacity:0; transform:translateX(-24px) } to { opacity:1; transform:translateX(0) } }
        @keyframes fadeRight { from { opacity:0; transform:translateX(24px) } to { opacity:1; transform:translateX(0) } }
        @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
        @keyframes float     { 0%,100% { transform:translateY(0px) } 50% { transform:translateY(-10px) } }
        @keyframes pulse-ring { 0% { transform:scale(1); opacity:.6 } 100% { transform:scale(1.8); opacity:0 } }
        @keyframes marquee   { from { transform:translateX(0) } to { transform:translateX(-50%) } }
        @keyframes shimmer   { from { background-position:-400px 0 } to { background-position:400px 0 } }
        @keyframes spin-slow { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes slide-up  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }

        .anim-up    { animation: fadeUp    .65s cubic-bezier(.22,.68,0,1.2) both }
        .anim-left  { animation: fadeLeft  .65s cubic-bezier(.22,.68,0,1.2) both }
        .anim-right { animation: fadeRight .65s cubic-bezier(.22,.68,0,1.2) both }
        .anim-in    { animation: fadeIn    .8s ease both }
        .d1 { animation-delay:.1s } .d2 { animation-delay:.2s } .d3 { animation-delay:.3s }
        .d4 { animation-delay:.4s } .d5 { animation-delay:.5s } .d6 { animation-delay:.6s }

        .float      { animation: float 5s ease-in-out infinite }
        .float-slow { animation: float 7s ease-in-out infinite }
        .pulse-dot  { position:relative }
        .pulse-dot::before {
          content:''; position:absolute; inset:-4px; border-radius:50%;
          background:currentColor; opacity:.3;
          animation: pulse-ring 1.8s ease-out infinite;
        }

        .marquee-wrap { overflow:hidden; -webkit-mask:linear-gradient(90deg,transparent,white 8%,white 92%,transparent) }
        .marquee-inner { display:flex; gap:2rem; width:max-content; animation:marquee 30s linear infinite }
        .marquee-inner:hover { animation-play-state:paused }

        .feature-card { transition: transform .25s ease, box-shadow .25s ease, background .25s ease }
        .feature-card:hover { transform:translateY(-5px) }
        .pricing-card { transition: transform .2s ease, box-shadow .2s ease }
        .pricing-card:hover { transform:translateY(-5px) }
        .testi-card { transition: transform .2s ease }
        .testi-card:hover { transform:translateY(-3px) }

        .pain-item { transition: all .4s cubic-bezier(.22,.68,0,1.2) }
        .pain-active { animation: slide-up .4s ease both }

        .hero-glow {
          position:absolute; border-radius:50%; pointer-events:none;
          filter:blur(100px); opacity:.08;
        }
        .btn-shine {
          position:relative; overflow:hidden;
        }
        .btn-shine::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
          transform:skewX(-20deg);
          transition:left .5s ease;
        }
        .btn-shine:hover::after { left:150% }

        .metric-card { transition: transform .2s ease, box-shadow .2s ease }
        .metric-card:hover { transform:translateY(-3px) }

        .scroll-reveal { opacity:0; transform:translateY(24px); transition: opacity .6s ease, transform .6s ease }
        .scroll-reveal.visible { opacity:1; transform:translateY(0) }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-surface-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <SajiinIcon size={38} />
            <span className="font-display text-xl font-extrabold text-dark-800 tracking-tight">Sajiin</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-500">
            {[['#cara-kerja','Cara Kerja'],['#fitur','Fitur'],['#harga','Harga'],['#testimoni','Ulasan'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} className="hover:text-primary-600 transition-colors">{label}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-sm font-medium text-primary-600 hover:text-primary-800 px-4 py-2 transition-colors">
              Masuk
            </button>
            <button onClick={() => navigate('/register')} className="btn-shine bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-colors">
              Coba Gratis 14 Hari →
            </button>
          </div>
          <button className="md:hidden p-2 text-dark-800" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-surface-200 bg-white px-4 py-4 space-y-3 anim-up">
            {[['#cara-kerja','Cara Kerja'],['#fitur','Fitur'],['#harga','Harga'],['#testimoni','Ulasan'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-muted-500 py-1">{label}</a>
            ))}
            <button onClick={() => navigate('/register')} className="btn-shine bg-primary-600 text-white font-semibold text-sm py-3 px-5 rounded-xl w-full mt-2 transition-colors">
              Coba Gratis 14 Hari
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-white">
        <div className="hero-glow w-[700px] h-[700px] bg-primary-400 -top-60 -right-60" />
        <div className="hero-glow w-[500px] h-[500px] bg-accent-400 top-20 -left-40" />
        <div className="hero-glow w-[300px] h-[300px] bg-primary-600 bottom-0 right-1/4" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-24 lg:py-28 w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left */}
          <div>
            <div className="anim-up inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" style={{color:'#22c55e'}} />
              Dipercaya 200+ bisnis kuliner Indonesia
            </div>

            <h1 className="anim-up d1 font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-dark-800 leading-[1.05] tracking-tight mb-5">
              Dari Pesanan<br />
              ke Sajian,<br />
              <span className="text-accent-400">Semua Mudah.</span>
            </h1>

            <p className="anim-up d2 text-base sm:text-lg text-muted-500 leading-relaxed mb-8 max-w-lg">
              Satu aplikasi untuk kasir, stok, produksi, pesanan, dan laporan bisnis kuliner Anda.
              Mudah dipakai, bisa offline, dan jalan di semua perangkat.
            </p>

            <div className="anim-up d3 flex flex-col sm:flex-row gap-4 items-start mb-8">
              <button
                onClick={() => navigate('/register')}
                className="btn-shine group bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2.5 shadow-warm-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Mulai Gratis 14 Hari
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => window.open('https://wa.me/6208970120687?text=Halo, saya ingin tahu lebih lanjut tentang Sajiin', '_blank')}
                className="flex items-center gap-2.5 text-primary-600 font-semibold px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl border-2 border-primary-100 hover:border-primary-300 hover:bg-primary-50 transition-all text-sm sm:text-base"
              >
                <MessageCircle className="w-5 h-5" />
                Tanya via WhatsApp
              </button>
            </div>

            <div className="anim-up d4 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-400">
              {['Tanpa kartu kredit', 'Setup 2 menit', 'Cancel kapan saja'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — floating UI cards */}
          <div className="hidden lg:flex flex-col gap-4 items-end float">
            {/* Main card */}
            <div className="anim-right bg-white rounded-3xl shadow-warm-lg border border-surface-200 p-6 w-80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium text-muted-400">Total Penjualan Hari Ini</p>
                  <p className="text-2xl font-extrabold text-dark-800 font-display mt-0.5">Rp 2.840.000</p>
                </div>
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">↑ 12%</span>
                <span className="text-xs text-muted-400">dari kemarin</span>
              </div>
              <div className="space-y-1.5">
                {[['Croissant Butter', '48 pcs', 72],['Kopi Susu', '36 gls', 58],['Brownies', '24 pcs', 45]].map(([name, qty, pct]) => (
                  <div key={name as string}>
                    <div className="flex justify-between text-xs text-muted-500 mb-0.5">
                      <span>{name}</span><span>{qty}</span>
                    </div>
                    <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{width:`${pct}%`}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 w-80">
              {/* Notif card */}
              <div className="anim-right d1 bg-accent-400 rounded-2xl shadow-warm p-4 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Stok menipis</p>
                    <p className="text-xs text-orange-100">Tepung sisa 2 kg</p>
                  </div>
                </div>
              </div>
              {/* Shift card */}
              <div className="anim-right d2 bg-primary-600 rounded-2xl shadow-warm p-4 flex-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Shift aktif</p>
                    <p className="text-xs text-primary-200">14 transaksi</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-order card */}
            <div className="anim-right d2 bg-white rounded-2xl shadow-warm border border-surface-200 p-4 w-80">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-dark-800">Pre-order hari ini</p>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">3 pesanan</span>
              </div>
              <div className="space-y-2">
                {[['Budi S.','Siap Ambil','green'],['Dewi R.','Diproduksi','amber'],['Ahmad F.','Dikonfirmasi','blue']].map(([name, status, color]) => (
                  <div key={name as string} className="flex items-center justify-between">
                    <span className="text-xs text-muted-500">{name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-${color}-100 text-${color}-700`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────────────────────────────── */}
      <div className="bg-surface-50 border-y border-surface-200 py-3">
        <div className="marquee-wrap">
          <div className="marquee-inner">
            {['Kasir Digital','Manajemen Stok','Laporan Otomatis','Pre-Order','Food Cost','Multi Outlet','Offline Mode','Export Excel/PDF','Forecast Produksi','Resep & COGS','Manajemen Staff','Stock Opname','Kasir Digital','Manajemen Stok','Laporan Otomatis','Pre-Order','Food Cost','Multi Outlet','Offline Mode','Export Excel/PDF','Forecast Produksi','Resep & COGS','Manajemen Staff','Stock Opname'].map((t, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 flex-shrink-0" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {METRICS.map(({ icon: Icon, label, value: _, sub }, i) => {
              const counts = [c1, c2, c3, 99]
              const suffixes = ['+', 'rb+', '%', '.9%']
              const val = i < 3 ? `${counts[i]}${suffixes[i]}` : _
              return (
                <div key={label} className="metric-card bg-surface-50 border border-surface-200 rounded-2xl p-6 text-center">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-primary-600">{val}</p>
                  <p className="font-body text-sm font-semibold text-dark-800 mt-1">{label}</p>
                  <p className="font-body text-xs text-muted-400">{sub}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PAIN → GAIN ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-dark-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/10 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Masalah yang Kami Selesaikan</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Berhenti kelola bisnis<br />dengan cara lama
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {PAIN_POINTS.map(({ before, after }, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border transition-all duration-500 ${activePain === i ? 'border-accent-400 bg-white/10 scale-[1.02]' : 'border-white/10 bg-white/5'}`}
                onMouseEnter={() => setActivePain(i)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-red-400 text-lg flex-shrink-0 mt-0.5">✕</span>
                  <p className={`text-sm leading-relaxed line-through ${activePain === i ? 'text-surface-400' : 'text-surface-400'}`}>{before}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className={`text-lg flex-shrink-0 mt-0.5 ${activePain === i ? 'text-accent-400' : 'text-green-400'}`}>✓</span>
                  <p className={`text-sm font-semibold leading-relaxed ${activePain === i ? 'text-white' : 'text-surface-300'}`}>{after}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 gap-2">
            {PAIN_POINTS.map((_, i) => (
              <button key={i} onClick={() => setActivePain(i)}
                className={`w-2 h-2 rounded-full transition-all ${activePain === i ? 'bg-accent-400 w-6' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CARA KERJA ───────────────────────────────────────────────────── */}
      <section id="cara-kerja" className="py-16 sm:py-24 bg-surface-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Mudah Dimulai</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-dark-800 leading-tight tracking-tight">
              Mulai dalam 3 langkah
            </h2>
            <p className="text-muted-500 text-lg mt-4 max-w-xl mx-auto">Tidak perlu training khusus. Tidak perlu tim IT. Langsung jalan hari pertama.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(({ no, icon: Icon, title, desc }, i) => (
              <div key={no} className="relative group">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px border-t-2 border-dashed border-primary-200 -translate-x-12 z-0" />
                )}
                <div className="relative z-10 bg-white rounded-3xl p-8 shadow-warm border border-surface-200 hover:shadow-warm-lg transition-all hover:-translate-y-1">
                  <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-bold text-primary-300 tracking-widest">{no}</span>
                  <h3 className="font-display text-xl font-bold text-dark-800 mb-2 mt-1">{title}</h3>
                  <p className="font-body text-sm text-muted-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => navigate('/register')} className="btn-shine bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-2xl inline-flex items-center gap-2.5 shadow-warm transition-all hover:scale-[1.02]">
              Coba Sekarang — Gratis 14 Hari <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="fitur" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Fitur Lengkap</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-dark-800 leading-tight tracking-tight">
              Semua yang dibutuhkan<br />bisnis kuliner Anda
            </h2>
            <p className="text-muted-500 text-lg mt-4">Satu platform, semua operasional terkendali</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card group bg-surface-50 hover:bg-primary-600 border border-surface-200 rounded-2xl p-6 cursor-default">
                <div className="w-11 h-11 bg-primary-100 group-hover:bg-white/20 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <Icon className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-display text-base font-bold text-dark-800 group-hover:text-white mb-2 transition-colors">{title}</h3>
                <p className="font-body text-sm text-muted-500 group-hover:text-primary-200 leading-relaxed transition-colors">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BANNER ──────────────────────────────────────────── */}
      <section className="py-10 sm:py-12 bg-primary-600">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {['SD','BS','DR','AF','RM','HW'].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{i}</div>
                ))}
              </div>
              <div>
                <p className="font-body font-semibold text-white">200+ pemilik bisnis kuliner</p>
                <p className="font-body text-sm text-primary-200">sudah pakai Sajiin setiap harinya</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-3">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-accent-300 text-accent-300" />)}
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-none">4.9</p>
                <p className="text-primary-200 text-xs">127 ulasan</p>
              </div>
            </div>
            <button onClick={() => navigate('/register')} className="btn-shine bg-white text-primary-700 hover:bg-surface-100 font-bold px-6 py-3 rounded-xl transition-all hover:scale-[1.02] flex items-center gap-2 flex-shrink-0">
              Bergabung Sekarang <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="harga" className="py-16 sm:py-24 bg-surface-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Harga Transparan</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-dark-800 leading-tight tracking-tight mb-3">
              Tanpa biaya tersembunyi
            </h2>
            <p className="text-muted-500 text-lg mb-8">Mulai gratis 14 hari, bisa upgrade atau cancel kapan saja</p>
            <div className="inline-flex items-center bg-white border border-surface-200 rounded-xl p-1.5 gap-1 shadow-warm">
              {[['Bulanan', false],['Tahunan', true]].map(([label, val]) => (
                <button key={label as string} onClick={() => setBillingAnnual(val as boolean)}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${billingAnnual === val ? 'bg-primary-600 text-white shadow-warm' : 'text-muted-500 hover:text-dark-800'}`}>
                  {label}
                  {val && <span className="ml-1.5 text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Hemat 20%</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div key={plan.key} className={`pricing-card relative rounded-3xl p-6 sm:p-8 flex flex-col border-2 ${plan.highlight ? 'bg-primary-600 border-primary-600 shadow-warm-lg' : 'bg-white border-surface-200 shadow-warm'}`}>
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-accent-400 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-warm">{plan.badge}</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`font-display text-2xl font-extrabold mb-1 ${plan.highlight ? 'text-white' : 'text-dark-800'}`}>{plan.name}</h3>
                  <p className={`text-sm ${plan.highlight ? 'text-primary-200' : 'text-muted-400'}`}>{plan.desc}</p>
                </div>
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className={`font-display text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-dark-800'}`}>{formatPrice(plan.price)}</span>
                    {plan.price > 0 && <span className={`text-sm ${plan.highlight ? 'text-primary-200' : 'text-muted-400'}`}>{plan.period}</span>}
                  </div>
                  {billingAnnual && plan.price > 0 && (
                    <p className="text-xs text-green-400 mt-1 font-medium">Hemat 20% vs bulanan</p>
                  )}
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.highlight ? 'text-white' : 'text-primary-600'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-accent-300' : 'text-green-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  {plan.key !== 'enterprise' && plan.price > 0 && (
                    <button onClick={() => setCheckoutPlan(plan.key as 'basic' | 'pro')}
                      className={`btn-shine w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] ${plan.highlight ? 'bg-white text-primary-700 hover:bg-surface-100' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
                      Beli Sekarang
                    </button>
                  )}
                  {plan.key === 'enterprise' ? (
                    <button onClick={() => window.open('https://wa.me/6208970120687?text=Halo, saya ingin info paket Enterprise Sajiin', '_blank')}
                      className="btn-shine w-full py-3.5 rounded-2xl font-bold text-sm bg-dark-800 text-white hover:bg-dark-700 transition-all hover:scale-[1.02]">
                      Hubungi Sales
                    </button>
                  ) : (
                    <button onClick={() => navigate('/register')}
                      className={`w-full py-2.5 rounded-2xl text-sm font-medium transition-colors ${plan.highlight ? 'text-primary-200 hover:text-white' : 'text-muted-400 hover:text-primary-600'}`}>
                      Coba Gratis 14 Hari →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-400 mt-8">
            Semua paket sudah termasuk support & update. Tidak ada biaya tambahan.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section id="testimoni" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Kata Mereka</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-dark-800 leading-tight tracking-tight">
              Bisnis mereka sudah<br />berubah bersama Sajiin
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {TESTIMONIALS.map(({ name, role, text, stars, avatar }, i) => (
              <div key={name} className={`testi-card rounded-2xl sm:rounded-3xl p-5 sm:p-7 border-2 ${i === 1 || i === 4 ? 'bg-primary-600 border-primary-600' : 'bg-white border-surface-200 shadow-warm'}`}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${i === 1 || i === 4 ? 'fill-accent-300 text-accent-300' : 'fill-accent-400 text-accent-400'}`} />
                  ))}
                </div>
                <p className={`text-sm leading-relaxed mb-6 ${i === 1 || i === 4 ? 'text-primary-100' : 'text-muted-600'}`}>"{text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${i === 1 || i === 4 ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'}`}>{avatar}</div>
                  <div>
                    <p className={`text-sm font-bold ${i === 1 || i === 4 ? 'text-white' : 'text-dark-800'}`}>{name}</p>
                    <p className={`text-xs ${i === 1 || i === 4 ? 'text-primary-200' : 'text-muted-400'}`}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24 bg-surface-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">FAQ</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-dark-800 leading-tight tracking-tight">
              Pertanyaan yang<br />sering ditanyakan
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <div key={i} className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${openFaq === i ? 'border-primary-300 shadow-warm' : 'border-surface-200'}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 text-left"
                >
                  <span className="font-body text-sm font-semibold text-dark-800 pr-4">{q}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === i ? 'bg-primary-600' : 'bg-surface-100'}`}>
                    {openFaq === i
                      ? <ChevronUp className="w-3.5 h-3.5 text-white" />
                      : <ChevronDown className="w-3.5 h-3.5 text-muted-500" />
                    }
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-5 anim-up">
                    <p className="font-body text-sm text-muted-500 leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-400 mt-8">
            Masih ada pertanyaan?{' '}
            <a href="/faq" className="text-primary-600 font-medium hover:underline">Lihat semua FAQ</a>
            {' '} atau {' '}
            <button onClick={() => window.open('https://wa.me/6208970120687', '_blank')} className="text-primary-600 font-medium hover:underline">
              chat kami via WhatsApp
            </button>
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-primary-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="hero-glow w-[500px] h-[500px] bg-accent-400 -top-40 -right-40 opacity-20" />
        <div className="hero-glow w-[400px] h-[400px] bg-primary-800 bottom-0 -left-20 opacity-30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-6 float-slow">
            <SajiinIcon size={64} white />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Siap kelola bisnis<br />lebih mudah hari ini?
          </h2>
          <p className="text-primary-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Bergabung dengan ratusan pemilik bisnis kuliner yang sudah merasakan bedanya.
            Mulai gratis, tidak perlu kartu kredit.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button onClick={() => navigate('/register')}
              className="btn-shine group bg-white text-primary-700 hover:bg-surface-100 font-bold px-10 py-4 rounded-2xl flex items-center gap-2.5 shadow-warm-lg transition-all hover:scale-[1.02]">
              Mulai Trial 14 Hari Gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => window.open('https://wa.me/6208970120687?text=Halo Sajiin, saya ingin tahu lebih lanjut', '_blank')}
              className="flex items-center gap-2.5 text-white border-2 border-white/30 hover:border-white font-semibold px-7 py-4 rounded-2xl transition-all">
              <MessageCircle className="w-5 h-5" />
              Tanya Dulu via WA
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-primary-200 text-xs sm:text-sm">
            {['Gratis 14 hari','Tanpa kartu kredit','Cancel kapan saja'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-accent-300" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-dark-900 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 mb-10 sm:mb-12">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <SajiinIcon size={36} white />
                <span className="font-display text-xl font-extrabold text-white tracking-tight">Sajiin</span>
              </div>
              <p className="text-surface-400 text-sm leading-relaxed max-w-xs mb-5">
                Dari pesanan ke sajian, semua jadi mudah. Solusi manajemen bisnis kuliner yang mudah, andal, dan terjangkau untuk UMKM Indonesia.
              </p>
              <button onClick={() => window.open('https://wa.me/6208970120687', '_blank')}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                <MessageCircle className="w-4 h-4" />
                08970120687
              </button>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-4">Produk</p>
              <ul className="space-y-2.5">
                {[['#fitur','Fitur'],['#harga','Harga'],['#cara-kerja','Cara Kerja'],['#testimoni','Ulasan']].map(([href,label]) => (
                  <li key={label}><a href={href} className="text-surface-400 hover:text-white text-sm transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-4">Bantuan</p>
              <ul className="space-y-2.5">
                {[['/faq','FAQ'],['/','Update'],['mailto:hello@sajiin.com','Kontak']].map(([href,label]) => (
                  <li key={label}><a href={href} className="text-surface-400 hover:text-white text-sm transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white text-sm font-semibold mb-4">Legal</p>
              <ul className="space-y-2.5">
                {[['/privacy','Kebijakan Privasi'],['/terms','Syarat & Ketentuan']].map(([href,label]) => (
                  <li key={label}><a href={href} className="text-surface-400 hover:text-white text-sm transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-surface-500 text-xs">© {new Date().getFullYear()} Sajiin. Semua hak dilindungi.</p>
            <p className="text-surface-500 text-xs">Dibuat dengan ♥ untuk bisnis kuliner Indonesia</p>
          </div>
        </div>
      </footer>

      {checkoutPlan && (
        <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
      )}
    </div>
  )
}
