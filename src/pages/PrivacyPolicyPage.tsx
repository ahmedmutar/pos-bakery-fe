import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'

const LAST_UPDATED = '25 April 2026'
const COMPANY = 'Sajiin'
const EMAIL = 'privacy@sajiin.com'
const WA = 'https://wa.me/6285947566558'

export default function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <div className="bg-white border-b border-surface-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-body text-muted-500 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <div className="h-4 w-px bg-surface-200" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-500" />
            <span className="font-body text-sm font-medium text-primary-600">Kebijakan Privasi</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Title */}
        <div className="mb-10">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark-800 mb-2">Kebijakan Privasi</h1>
          <p className="font-body text-sm text-muted-400">Terakhir diperbarui: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 font-body text-primary-600 leading-relaxed">

          {/* Intro */}
          <div className="bg-white rounded-2xl border border-surface-200 px-6 py-5">
            <p className="text-sm">
              {COMPANY} ("<strong>kami</strong>", "<strong>kita</strong>") berkomitmen melindungi privasi pengguna platform manajemen bisnis kuliner kami. Kebijakan ini menjelaskan data apa yang kami kumpulkan, bagaimana kami menggunakannya, dan hak-hak Anda.
            </p>
          </div>

          <Section title="1. Data yang Kami Kumpulkan">
            <SubSection title="Data Akun">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Nama, alamat email, dan nomor telepon saat registrasi</li>
                <li>Nama toko dan informasi bisnis yang Anda masukkan</li>
                <li>Password yang disimpan dalam bentuk terenkripsi (hash bcrypt)</li>
              </ul>
            </SubSection>
            <SubSection title="Data Operasional">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Data transaksi kasir, produk, inventaris, dan laporan yang Anda input</li>
                <li>Data pesanan pelanggan (pre-order) yang Anda catat</li>
                <li>Rencana produksi dan catatan stok bahan baku</li>
              </ul>
            </SubSection>
            <SubSection title="Data Teknis">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Alamat IP dan browser yang digunakan saat login</li>
                <li>Log aktivitas sistem untuk keamanan dan debugging</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="2. Cara Kami Menggunakan Data">
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Menyediakan dan mengoperasikan layanan {COMPANY}</li>
              <li>Memproses pembayaran dan mengelola langganan Anda</li>
              <li>Mengirim notifikasi terkait akun dan layanan (email)</li>
              <li>Merespons pertanyaan dan permintaan dukungan</li>
              <li>Meningkatkan fitur dan performa platform berdasarkan pola penggunaan agregat</li>
              <li>Memenuhi kewajiban hukum yang berlaku</li>
            </ul>
          </Section>

          <Section title="3. Penyimpanan dan Keamanan Data">
            <p className="text-sm mb-3">
              Data Anda disimpan di server yang berlokasi di wilayah yang aman dengan enkripsi data saat transit (HTTPS/TLS) maupun saat disimpan. Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi data Anda dari akses tidak sah.
            </p>
            <p className="text-sm">
              Kami menyimpan data akun selama akun Anda aktif. Jika Anda menghapus akun, data akan dihapus dalam 30 hari, kecuali jika kami diwajibkan menyimpannya oleh hukum.
            </p>
          </Section>

          <Section title="4. Berbagi Data dengan Pihak Ketiga">
            <p className="text-sm mb-3">Kami tidak menjual data Anda. Kami hanya berbagi data dengan:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>Xendit</strong> — pemroses pembayaran untuk menangani transaksi langganan</li>
              <li><strong>Railway / Vercel</strong> — penyedia infrastruktur cloud tempat platform berjalan</li>
              <li>Pihak berwenang jika diwajibkan oleh hukum yang berlaku di Indonesia</li>
            </ul>
          </Section>

          <Section title="5. Cookie dan Penyimpanan Lokal">
            <p className="text-sm">
              Kami menggunakan localStorage browser untuk menyimpan token autentikasi dan preferensi antarmuka. Kami tidak menggunakan cookie pihak ketiga untuk pelacakan iklan.
            </p>
          </Section>

          <Section title="6. Hak-Hak Anda">
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>Akses</strong> — Anda berhak meminta salinan data yang kami simpan tentang Anda</li>
              <li><strong>Koreksi</strong> — Anda dapat memperbarui data akun langsung melalui pengaturan</li>
              <li><strong>Penghapusan</strong> — Anda dapat meminta penghapusan akun dan data Anda</li>
              <li><strong>Portabilitas</strong> — Anda dapat mengekspor data transaksi dalam format Excel/PDF</li>
            </ul>
            <p className="text-sm mt-3">
              Untuk menggunakan hak-hak ini, hubungi kami di <a href={`mailto:${EMAIL}`} className="text-primary-700 font-medium underline">{EMAIL}</a>.
            </p>
          </Section>

          <Section title="7. Perubahan Kebijakan">
            <p className="text-sm">
              Kami dapat memperbarui kebijakan ini sewaktu-waktu. Jika ada perubahan signifikan, kami akan memberitahu Anda melalui email atau notifikasi dalam aplikasi setidaknya 7 hari sebelum perubahan berlaku.
            </p>
          </Section>

          <Section title="8. Kontak">
            <p className="text-sm">
              Jika ada pertanyaan tentang kebijakan privasi ini, hubungi kami:
            </p>
            <div className="mt-3 bg-surface-50 rounded-xl px-4 py-3 space-y-1 text-sm">
              <p>Email: <a href={`mailto:${EMAIL}`} className="text-primary-700 font-medium">{EMAIL}</a></p>
              <p>WhatsApp: <a href={WA} target="_blank" rel="noreferrer" className="text-primary-700 font-medium">085947566558</a></p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-dark-800 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-body text-sm font-semibold text-primary-700 mb-2">{title}</p>
      {children}
    </div>
  )
}
