import { getAuditLog } from '@/lib/actions'
import type { AuditEntry } from '@/lib/actions'
import { FileText, Trash2, Copy, Eye, UserPlus, UserMinus, ShieldOff, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  quote_created:    { label: 'Created quote',       icon: <FileText size={14} />,    color: 'bg-brand-50 text-brand-500' },
  quote_deleted:    { label: 'Deleted quote',        icon: <Trash2 size={14} />,      color: 'bg-red-50 text-red-400' },
  quote_duplicated: { label: 'Duplicated quote',     icon: <Copy size={14} />,        color: 'bg-purple-50 text-purple-400' },
  prospect_viewed:  { label: 'Prospect viewed page', icon: <Eye size={14} />,         color: 'bg-gray-100 text-gray-400' },
  user_created:     { label: 'Created user',         icon: <UserPlus size={14} />,    color: 'bg-green-50 text-green-500' },
  user_deleted:     { label: 'Deleted user',         icon: <UserMinus size={14} />,   color: 'bg-red-50 text-red-400' },
  user_deactivated: { label: 'Deactivated user',     icon: <ShieldOff size={14} />,   color: 'bg-amber-50 text-amber-500' },
  user_activated:   { label: 'Activated user',       icon: <ShieldCheck size={14} />, color: 'bg-green-50 text-green-500' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByDate(entries: AuditEntry[]): { label: string; entries: AuditEntry[] }[] {
  const groups: Record<string, AuditEntry[]> = {}
  for (const e of entries) {
    const d = new Date(e.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!groups[label]) groups[label] = []
    groups[label].push(e)
  }
  return Object.entries(groups).map(([label, entries]) => ({ label, entries }))
}

export default async function ActivityPage() {
  const entries = await getAuditLog(200)
  const groups = groupByDate(entries)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-brand-900">Activity Log</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last 200 events across all users</p>
        </div>

        {entries.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">No activity yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {groups.map(group => (
              <div key={group.label}>
                <div className="px-6 py-2 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {group.label}
                </div>
                {group.entries.map(entry => {
                  const cfg = ACTION_CONFIG[entry.action] ?? {
                    label: entry.action,
                    icon: <FileText size={14} />,
                    color: 'bg-gray-100 text-gray-400',
                  }
                  return (
                    <div key={entry.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">{entry.actor_name}</span>
                          {' '}{cfg.label}{' '}
                          <span className="font-medium text-brand-700">{entry.target_label}</span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(entry.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
