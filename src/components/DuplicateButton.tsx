'use client'

import { useTransition } from 'react'
import { Copy } from 'lucide-react'
import { duplicateProspect } from '@/lib/actions'
import Tooltip from './Tooltip'

export default function DuplicateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Tooltip label="Duplicate as template">
      <button
        onClick={() => startTransition(() => duplicateProspect(id))}
        disabled={isPending}
        className="p-1.5 text-brand-400 hover:text-brand-600 transition-colors disabled:opacity-40"
      >
        <Copy size={15} />
      </button>
    </Tooltip>
  )
}
