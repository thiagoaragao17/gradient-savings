'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProspect } from '@/lib/actions'

export default function DeleteButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => startTransition(() => deleteProspect(id))}
          disabled={isPending}
          className="text-xs font-medium text-blush-500 hover:text-blush-600 transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'Delete'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-brand-400 hover:text-brand-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title="Delete prospect"
      className="p-1.5 text-brand-300 hover:text-blush-400 transition-colors"
    >
      <Trash2 size={15} />
    </button>
  )
}
