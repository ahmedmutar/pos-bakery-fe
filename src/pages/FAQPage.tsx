import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, MessageCircle } from 'lucide-react'
import { cn } from '../lib/utils'

const FAQS = [
  {
    category: 'Umum',
    items: [
      {
        q: 'Apa itu Sajiin?',
        a: 'Sajiin adalah sistem manajemen bisnis kuliner berbasis web yang dirancang khusus untuk usaha bisnis kuliner dan bisnis kuliner. Fiturnya mencakup kasir harian, manajemen produksi, inventaris bahan baku, resep & food cost, pre-order pelanggan, hingga laporan penjualan.',
      },
      {
        q: 'Apakah bisa digunakan tanpa internet?',
        a: 'Ya. Fitur kasir mendukung mode offline — kasir tetap bisa mencatat transaksi meskipun koneksi internet terputus. Transaksi akan tersinkronisasi otomatis ke server saat koneksi pulih.',
      },
      {
        q: 'Perangkat apa saja yang didukung?',
        a: 'Sajiin berbasis web sehingga bisa diakses dari browser di laptop, tablet, maupun smartphone. Tidak perlu install aplikasi. Direkomendasikan menggunakan Chrome atau Safari versi terbaru.',
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Data disimpan di server yang terenkripsi dengan koneksi HTTPS. Data operasional toko Anda adalah milik Anda sepenuhnya — kami tidak menjual atau membagikannya ke pihak ketiga. Anda juga bisa mengekspor data kapan saja dalam format Excel atau PDF.',
      },
    ],
  },
  {
    category: 'Paket & Harga',
    items: [
      {
        q: 'Apakah ada masa percobaan gratis?',
        a: 'Ya, semua akun baru mendapat trial gratis selama 14 hari tanpa memerlukan kartu kredit. Anda bisa mencoba semua fitur paket Basic selama periode trial.',
      },
      {
        q: 'Apa perbedaan paket Basic, Pro, dan Enterprise?',
        a: 'Basic cocok untuk 1 outlet dengan hingga 3 staff dan 50 produk. Pro mendukung hingga 5 outlet, 10 staff, produk tak terbatas, fitur forecast produksi, dan import Excel. Enterprise untuk jaringan bisnis kuliner besar dengan outlet dan staff tak terbatas, white label, dan akses API.',
      },
      {
        q: 'Bagaimana cara upgrade paket?',
        a: 'Anda bisa upgrade langsung dari halaman Billing di dalam aplikasi. Pembayaran diproses via Xendit dan mendukung transfer bank, QRIS, GoPay, OVO, Dana, dan kartu kredit. Akun langsung aktif setelah pembayaran berhasil.',
      },
      {
        q: 'Apakah ada diskon untuk pembayaran tahunan?',
        a: 'Ya, pembayaran tahunan mendapat diskon 20% dibanding pembayaran bulanan. Hubungi kami via WhatsApp untuk proses pembayaran tahunan.',
      },
      {
        q: 'Bagaimana kebijakan refund?',
        a: 'Kami tidak menyediakan pengembalian dana untuk periode yang sudah berjalan. Jika ada masalah teknis dari pihak kami dalam 3 hari pertama, hubungi support dan kami akan meninjau setiap kasus secara individual.',
      },
    ],
  },
  {
    category: 'Fitur Kasir',
    items: [
      {
        q: 'Apakah bisa mencetak struk?',
        a: 'Ya. Sajiin mendukung cetak struk termal 58mm dan 80mm melalui browser. Anda bisa mencetak langsung setelah transaksi atau dari riwayat transaksi shift.',
      },
      {
        q: 'Metode pembayaran apa saja yang didukung?',
        a: 'Kasir mendukung Tunai, QRIS (menggunakan QR code toko Anda sendiri), dan Transfer Bank. Info rekening bank dan QR code QRIS bisa diatur oleh Owner di menu Pengaturan.',
      },
      {
        q: 'Bisakah kasir memberikan diskon?',
        a: 'Ya. Kasir bisa menerapkan diskon nominal per transaksi. Diskon dibatasi maksimum sesuai subtotal — tidak bisa melebihi nilai belanja.',
      },
      {
        q: 'Bagaimana cara mengelola beberapa outlet?',
        a: 'Paket Pro dan Enterprise mendukung multi-outlet. Setiap outlet punya shift kasir terpisah, dan Owner bisa melihat laporan per outlet maupun gabungan dari dashboard.',
      },
    ],
  },
  {
    category: 'Produksi & Inventaris',
    items: [
      {
        q: 'Apa itu fitur rencana produksi?',
        a: 'Rencana produksi memungkinkan tim produksi membuat target harian — berapa pcs setiap produk yang akan diproduksi. Setelah selesai, tim bisa mencatat hasil aktual, waste, dan stok tidak terjual. Stok bahan baku otomatis berkurang sesuai resep.',
      },
      {
        q: 'Bagaimana cara menghitung food cost?',
        a: 'Masukkan resep untuk setiap produk beserta bahan baku dan harga per satuan. Sistem akan otomatis menghitung food cost per produk dan margin keuntungan berdasarkan harga jual yang Anda tetapkan.',
      },
      {
        q: 'Apa itu Stock Opname?',
        a: 'Stock Opname adalah fitur untuk rekonsiliasi stok sistem vs fisik (paket Pro ke atas). Buat sesi opname, masukkan qty fisik per bahan baku, lalu selesaikan — stok sistem akan diperbarui sesuai hitungan fisik. Paket Basic bisa menggunakan fitur Sesuaikan Stok untuk penyesuaian satu bahan.',
      },
    ],
  },
  {
    category: 'Teknis',
    items: [
      {
        q: 'Berapa banyak data yang bisa disimpan?',
        a: 'Tidak ada batasan kapasitas penyimpanan data. Anda bisa menyimpan transaksi, produk, dan data inventaris sebanyak yang dibutuhkan.',
      },
      {
        q: 'Bagaimana cara backup data?',
        a: 'Anda bisa mengekspor laporan penjualan, data transaksi, dan inventaris ke format Excel atau PDF kapan saja dari menu Laporan. Untuk backup lengkap, hubungi support kami.',
      },
      {
        q: 'Apakah ada API untuk integrasi dengan sistem lain?',
        a: 'Akses API tersedia untuk paket Enterprise. Dengan API, Anda bisa mengintegrasikan Sajiin dengan sistem akuntansi, e-commerce, atau marketplace. Hubungi kami untuk dokumentasi API.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-surface-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left"
      >
        <span className="font-body text-sm font-semibold text-dark-800">{q}</span>
        <ChevronDown className={cn(
          'w-4 h-4 text-muted-400 flex-shrink-0 mt-0.5 transition-transform duration-200',
          open && 'rotate-180'
        )} />
      </button>
      {open && (
        <p className="font-body text-sm text-muted-500 leading-relaxed pb-4">
          {a}
        </p>
      )}
    </div>
  )
}

export default function FAQPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState(FAQS[0].category)

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-body text-muted-500 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark-800 mb-3">
            Pertanyaan yang Sering Ditanyakan
          </h1>
          <p className="font-body text-sm text-muted-400 max-w-md mx-auto">
            Tidak menemukan jawaban yang Anda cari? Hubungi kami langsung via WhatsApp.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
          {/* Category tabs */}
          <div className="md:w-48 flex-shrink-0 w-full">
            <div className="flex md:flex-col gap-2 flex-wrap overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {FAQS.map(({ category }) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-body font-medium whitespace-nowrap transition-all text-left',
                    activeCategory === category
                      ? 'bg-accent-400 text-white shadow-warm'
                      : 'bg-white text-muted-500 hover:bg-surface-100 border border-surface-200'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ items */}
          <div className="flex-1">
            {FAQS.filter(f => f.category === activeCategory).map(({ category, items }) => (
              <div key={category} className="bg-white rounded-2xl border border-surface-200 px-6">
                {items.map((item) => (
                  <FAQItem key={item.q} {...item} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-primary-600 rounded-2xl p-8 text-center">
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Masih ada pertanyaan?
          </h2>
          <p className="font-body text-sm text-primary-100 mb-6">
            Tim kami siap membantu Anda setiap hari
          </p>
          <a
            href="https://wa.me/6285947566558?text=Halo, saya ingin bertanya tentang Sajiin"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-body font-semibold
                       text-sm px-6 py-3 rounded-xl hover:bg-surface-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Chat via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
