import { Suspense } from 'react'
import PrefillWrapper from '@/components/PrefillWrapper'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function NewProspectPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-brand-500 mb-6">
        <Link href="/admin" className="hover:text-brand-700 transition-colors">
          Quotes
        </Link>
        <ChevronRight size={14} />
        <span className="text-brand-800">New Quote</span>
      </nav>

      <h1 className="text-2xl font-bold text-brand-900 mb-6">New Quote</h1>
      <Suspense>
        <PrefillWrapper />
      </Suspense>
    </div>
  )
}
