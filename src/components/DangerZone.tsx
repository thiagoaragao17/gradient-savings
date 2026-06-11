'use client'

import { useState, useTransition } from 'react'
import { bulkDeleteExpired, bulkDeleteByStatus } from '@/lib/actions'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function DangerZone() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function confirm(label: string, action: () => Promise<{ deleted: number }>) {
    if (!window.confirm(`Are you sure you want to ${label}? This cannot be undone.`)) return
    setMessage(null)
    startTransition(async () => {
      const { deleted } = await action()
      setMessage(`Done — ${deleted} quote${deleted !== 1 ? 's' : ''} deleted.`)
    })
  }

  return (
    <section className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={16} className="text-red-400" />
        <h2 className="font-semibold text-red-700">Danger Zone</h2>
      </div>
      <p className="text-xs text-gray-500 mb-5">These actions are permanent and cannot be undone.</p>

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
          {message}
        </div>
      )}

      <div className="space-y-3">
        <DangerRow
          label="Delete all expired quotes"
          description="Removes every quote whose expiry date has passed."
          disabled={isPending}
          onClick={() => confirm('delete all expired quotes', bulkDeleteExpired)}
        />
        <DangerRow
          label="Delete all inactive quotes"
          description="Removes every quote with status set to Inactive."
          disabled={isPending}
          onClick={() => confirm('delete all inactive quotes', () => bulkDeleteByStatus('inactive'))}
        />
        <DangerRow
          label="Delete all lost quotes"
          description="Removes every quote marked as Closed Lost."
          disabled={isPending}
          onClick={() => confirm('delete all lost quotes', () => bulkDeleteByStatus('closed_lost'))}
        />
      </div>
    </section>
  )
}

function DangerRow({
  label,
  description,
  disabled,
  onClick,
}: {
  label: string
  description: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-100 first:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  )
}
