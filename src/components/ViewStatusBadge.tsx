import { Circle } from 'lucide-react'
import type { Prospect } from '@/lib/types'

export default function ViewStatusBadge({ prospect }: { prospect: Prospect }) {
  const opened = prospect.view_count > 0

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
      opened
        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
        : 'bg-amber-50 text-amber-600 ring-amber-200'
    }`}>
      <Circle size={6} className={`fill-current ${opened ? 'text-emerald-500' : 'text-amber-400'}`} />
      {opened ? 'Opened' : 'Sent'}
    </span>
  )
}
