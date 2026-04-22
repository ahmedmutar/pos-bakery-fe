import { Construction } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-14 h-14 bg-dough-100 rounded-2xl flex items-center justify-center">
        <Construction className="w-7 h-7 text-crust-400" />
      </div>
      <p className="font-display text-lg text-oven-700">{title}</p>
      <p className="font-body text-sm text-crust-400">Halaman ini sedang dalam pengembangan.</p>
    </div>
  )
}
