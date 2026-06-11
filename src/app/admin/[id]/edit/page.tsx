import { getProspectById, updateProspect } from '@/lib/actions'
import ProspectForm from '@/components/ProspectForm'
import AdminNav from '@/components/AdminNav'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default async function EditProspectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const prospect = await getProspectById(id)
  if (!prospect) notFound()

  const boundAction = updateProspect.bind(null, id)

  return (
    <div className="min-h-screen bg-brand-50">
      <AdminNav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-sm text-brand-500 mb-6">
          <Link href="/admin" className="hover:text-brand-700 transition-colors">
            Prospects
          </Link>
          <ChevronRight size={14} />
          <span className="text-brand-800 truncate max-w-xs">{prospect.company_name}</span>
        </nav>

        <h1 className="text-2xl font-bold text-brand-900 mb-6">
          Edit: {prospect.company_name}
        </h1>
        <ProspectForm prospect={prospect} action={boundAction} />
      </main>
    </div>
  )
}
