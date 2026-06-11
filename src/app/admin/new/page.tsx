import { Suspense } from 'react'
import PrefillWrapper from '@/components/PrefillWrapper'
import AdminNav from '@/components/AdminNav'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function NewProspectPage() {
  return (
    <div className="min-h-screen bg-brand-50">
      <AdminNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-brand-500 mb-6">
          <Link href="/admin" className="hover:text-brand-700 transition-colors">
            Prospects
          </Link>
          <ChevronRight size={14} />
          <span className="text-brand-800">New Prospect</span>
        </nav>

        <h1 className="text-2xl font-bold text-brand-900 mb-6">New Prospect</h1>
        <Suspense>
          <PrefillWrapper />
        </Suspense>
      </main>
    </div>
  )
}
