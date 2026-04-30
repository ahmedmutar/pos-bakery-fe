import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'

const LAST_UPDATED = '25 April 2026'
const COMPANY = 'Sajiin'
const EMAIL = 'support@sajiin.com'
const WA = 'https://wa.me/6285947566558'

export default function TermsPage() {
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
            <FileText className="w-4 h-4 text-muted-500" />
            <span className="font-body text-sm font-medium text-primary-600">Syarat & Ketentuan</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-10">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-dark-800 mb-2">Syarat & Ketentuan</h1>
          <p className="font-body text-sm text-muted-400">Terakhir diperbarui: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 font-body text-primary-600 leading-relaxed">

          <div className="bg-white rounded-2xl border border-surface-200 px-6 py-5">
            <p className="text-sm">
              Dengan mendaftar atau menggunakan platform <strong>{COMPANY}</strong>, Anda menyetujui syarat dan ketentuan ini. Baca dengan seksama sebelum menggunakan layanan kami.
            </p>
          </div>

          <Section title="1. Definisi">
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li><strong>"Layanan"</strong> merujuk pada platform manajemen bisnis kuliner {COMPANY}</li>
              <li><strong>"Pengguna"</strong> adalah individu atau bisnis yang mendaftar dan menggunakan Layanan</li>
              <li><strong>"Akun"</strong> adalah akses terdaftar ke Layanan</li>
              <li><strong>"Konten"</strong> adalah data yang Anda masukkan ke dalam Layanan (produk, transaksi, dll)</li>
            </ul>
          </Section>

          <Section title="2. Penggunaan Layanan">
            <p className="text-sm mb-3">Dengan menggunakan {COMPANY}, Anda menyatakan bahwa:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Anda berusia minimal 17 tahun atau memiliki persetujuan dari orang tua/wali</li>
              <li>Informasi yang Anda berikan saat registrasi adalah akurat dan terkini</li>
              <li>Anda bertanggung jawab penuh atas keamanan kredensial akun Anda</li>
              <li>Anda akan menggunakan Layanan hanya untuk tujuan bisnis yang sah</li>
              <li>Anda tidak akan menyalahgunakan, merekayasa balik, atau mengganggu sistem kami</li>
            </ul>
          </Section>

          <Section title="3. Paket Berlangganan dan Pembayaran">
            <div className="space-y-3 text-sm">
              <p>
                {COMPANY} menawarkan paket berlangganan bulanan (Basic, Pro, Enterprise). Harga berlaku pada saat pembelian dan dapat berubah dengan pemberitahuan 30 hari sebelumnya.
              </p>
              <p>
                <strong>Trial gratis</strong> berlaku selama 14 hari tanpa memerlukan kartu kredit. Setelah trial berakhir, Anda perlu berlangganan untuk melanjutkan akses penuh.
              </p>
              <p>
                <strong>Pembayaran</strong> diproses melalui Xendit. Kami tidak menyimpan informasi kartu kredit atau rekening bank Anda. Langganan berlaku 30 hari sejak tanggal pembayaran.
              </p>
              <p>
                <strong>Refund</strong>: Kami tidak menyediakan pengembalian dana untuk periode yang sudah berjalan. Jika ada masalah teknis dari pihak kami, hubungi kami dalam 3 hari kerja.
              </p>
            </div>
          </Section>

          <Section title="4. Data dan Kepemilikan Konten">
            <div className="space-y-3 text-sm">
              <p>
                Data yang Anda masukkan ke {COMPANY} (produk, transaksi, pelanggan) adalah milik Anda sepenuhnya. Kami hanya menyimpan dan memproses data tersebut untuk menjalankan Layanan.
              </p>
              <p>
                Anda dapat mengekspor data Anda kapan saja dalam format Excel atau PDF melalui fitur Laporan. Jika Anda menutup akun, kami akan menyediakan ekspor data terakhir sebelum penghapusan.
              </p>
            </div>
          </Section>

          <Section title="5. Ketersediaan Layanan">
            <div className="space-y-3 text-sm">
              <p>
                Kami berupaya menjaga ketersediaan Layanan 24/7, namun tidak menjamin uptime 100%. Pemeliharaan terjadwal akan diumumkan minimal 24 jam sebelumnya.
              </p>
              <p>
                {COMPANY} mendukung mode offline untuk fitur kasir — transaksi dapat dicatat tanpa koneksi internet dan akan tersinkronisasi otomatis saat koneksi kembali.
              </p>
            </div>
          </Section>

          <Section title="6. Batasan Tanggung Jawab">
            <div className="space-y-3 text-sm">
              <p>
                {COMPANY} disediakan "sebagaimana adanya". Kami tidak bertanggung jawab atas kerugian tidak langsung, kehilangan data akibat kesalahan pengguna, atau gangguan bisnis yang disebabkan oleh penggunaan Layanan.
              </p>
              <p>
                Total tanggung jawab kami kepada Anda tidak akan melebihi jumlah yang Anda bayarkan kepada kami dalam 3 bulan terakhir.
              </p>
            </div>
          </Section>

          <Section title="7. Penghentian Akun">
            <ul className="list-disc pl-5 space-y-1.5 text-sm">
              <li>Anda dapat menutup akun kapan saja melalui pengaturan atau dengan menghubungi kami</li>
              <li>Kami berhak menangguhkan atau menutup akun yang melanggar syarat ini tanpa pemberitahuan sebelumnya</li>
              <li>Setelah penutupan, data akan dihapus dalam 30 hari</li>
            </ul>
          </Section>

          <Section title="8. Perubahan Syarat">
            <p className="text-sm">
              Kami dapat memperbarui syarat ini. Perubahan akan diberitahukan melalui email atau notifikasi aplikasi minimal 7 hari sebelum berlaku. Penggunaan Layanan setelah tanggal efektif dianggap sebagai penerimaan syarat baru.
            </p>
          </Section>

          <Section title="9. Hukum yang Berlaku">
            <p className="text-sm">
              Syarat ini diatur oleh hukum Republik Indonesia. Setiap sengketa akan diselesaikan melalui musyawarah, dan jika tidak tercapai kesepakatan, melalui Pengadilan Negeri yang berwenang di Indonesia.
            </p>
          </Section>

          <Section title="10. Kontak">
            <p className="text-sm">Pertanyaan tentang syarat ini dapat disampaikan ke:</p>
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
