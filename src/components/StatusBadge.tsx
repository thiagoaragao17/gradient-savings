import type { Prospect } from '@/lib/types'

export default function StatusBadge({ prospect }: { prospect: Prospect }) {
  const isExpired = new Date(prospect.expiry_date) < new Date()

  if (isExpired || prospect.status === 'expired') {
    return (
      <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-blush-100 text-blush-500 font-medium">
        Expired
      </span>
    )
  }
  if (prospect.status === 'inactive') {
    return (
      <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
        Inactive
      </span>
    )
  }
  if (prospect.view_count === 0) {
    return (
      <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
        Not Opened
      </span>
    )
  }
  return (
    <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 font-medium">
      Opened
    </span>
  )
}
