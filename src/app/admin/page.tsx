import { getProspects } from '@/lib/actions'
import AdminNav from '@/components/AdminNav'
import ViewStatusBadge from '@/components/ViewStatusBadge'
import LeadStageDropdown from '@/components/LeadStageDropdown'
import CopyLinkButton from '@/components/CopyLinkButton'
import DeleteButton from '@/components/DeleteButton'
import DuplicateButton from '@/components/DuplicateButton'
import NewProspectButton from '@/components/NewProspectButton'
import Link from 'next/link'
import { Eye, ExternalLink, Pencil, BarChart3, Building2, DollarSign } from 'lucide-react'
import Tooltip from '@/components/Tooltip'
import type { Prospect } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const prospects = await getProspects()

  const totalPipeline = prospects.reduce((s, p) => s + p.annual_savings, 0)
  const unseenCount = prospects.filter(p => p.view_count === 0).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f6f3' }}>
      <AdminNav />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Building2 size={18} className="text-brand-400" />}
            label="Total Prospects"
            value={prospects.length.toString()}
          />
          <StatCard
            icon={<DollarSign size={18} className="text-brand-400" />}
            label="Annual Savings Pipeline"
            value={`$${Math.round(totalPipeline).toLocaleString('en-US')}`}
          />
          <StatCard
            icon={<BarChart3 size={18} className="text-brand-400" />}
            label="Not Yet Opened"
            value={unseenCount.toString()}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-brand-900">Prospects</h2>
            <NewProspectButton />
          </div>

          {prospects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-3">
                <Building2 size={22} className="text-brand-300" />
              </div>
              <p className="text-brand-600 font-medium mb-1">No prospects yet</p>
              <p className="text-brand-400 text-sm mb-4">Create your first prospect to get started.</p>
              <NewProspectButton />
            </div>
          ) : (
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-semibold">Quote ID</th>
                    <th className="text-left px-6 py-3 font-semibold">Company</th>
                    <th className="text-left px-6 py-3 font-semibold">Created</th>
                    <th className="text-left px-6 py-3 font-semibold">Provider</th>
                    <th className="text-right px-6 py-3 font-semibold">Annual Savings</th>
                    <th className="text-center px-6 py-3 font-semibold">Views</th>
                    <th className="text-left px-6 py-3 font-semibold">Last Seen</th>
                    <th className="text-left px-6 py-3 font-semibold">Expires</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-6 py-3 font-semibold">Lead Stage</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {prospects.map(p => (
                    <ProspectRow key={p.id} prospect={p} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-brand-900 leading-tight">{value}</p>
      </div>
    </div>
  )
}

function ProspectRow({ prospect: p }: { prospect: Prospect }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const prospectUrl = `${baseUrl}/p/${p.slug}`

  const created = new Date(p.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const lastSeen = p.last_viewed_at
    ? new Date(p.last_viewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—'

  const expiry = new Date(p.expiry_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const isExpired = new Date(p.expiry_date) < new Date()

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="px-6 py-4 text-xs text-gray-400 font-mono">
        {p.helcim_comparison_number ? `#${p.helcim_comparison_number}` : '—'}
      </td>
      <td className="px-6 py-4">
        <div className="font-medium text-brand-900">{p.company_name}</div>
        {p.company_address && (
          <div className="text-xs text-gray-400 mt-0.5 max-w-48 truncate">{p.company_address}</div>
        )}
      </td>
      <td className="px-6 py-4 text-xs text-gray-400">{created}</td>
      <td className="px-6 py-4 text-gray-500">{p.current_provider}</td>
      <td className="px-6 py-4 text-right font-semibold text-brand-700">
        ${p.annual_savings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-6 py-4 text-center">
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Eye size={13} />
          {p.view_count}
        </span>
      </td>
      <td className="px-6 py-4 text-gray-400 text-xs">{lastSeen}</td>
      <td className="px-6 py-4 text-xs">
        <span className={isExpired ? 'text-blush-400' : 'text-gray-400'}>{expiry}</span>
      </td>
      <td className="px-6 py-4">
        <ViewStatusBadge prospect={p} />
      </td>
      <td className="px-6 py-4">
        <LeadStageDropdown prospect={p} />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 justify-end">
          <CopyLinkButton url={prospectUrl} />
          <Tooltip label="Preview prospect page">
            <a
              href={prospectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-brand-400 hover:text-brand-600 transition-colors"
            >
              <ExternalLink size={15} />
            </a>
          </Tooltip>
          <Tooltip label="Edit prospect">
            <Link
              href={`/admin/${p.id}/edit`}
              className="p-1.5 text-brand-400 hover:text-brand-600 transition-colors"
            >
              <Pencil size={15} />
            </Link>
          </Tooltip>
          <DuplicateButton id={p.id} />
          <DeleteButton id={p.id} />
        </div>
      </td>
    </tr>
  )
}
