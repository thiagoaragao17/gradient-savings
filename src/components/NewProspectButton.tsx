'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import IngestModal from './IngestModal'

export default function NewProspectButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus size={15} />
        New Prospect
      </button>

      {open && <IngestModal onClose={() => setOpen(false)} />}
    </>
  )
}
