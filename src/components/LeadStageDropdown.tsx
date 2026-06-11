'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { updateLeadStage } from '@/lib/actions'
import type { Prospect } from '@/lib/types'

type Stage = Prospect['lead_stage']

const STAGES: { value: Stage; label: string; color: string }[] = [
  { value: 'new_lead',       label: 'New Lead',       color: 'bg-gray-100 text-gray-600 ring-gray-200' },
  { value: 'in_conversation',label: 'In Conversation', color: 'bg-blue-50 text-blue-600 ring-blue-200' },
  { value: 'negotiating',    label: 'Negotiating',    color: 'bg-lavender-50 text-lavender-700 ring-lavender-200' },
  { value: 'verbal_commit',  label: 'Verbal Commit',  color: 'bg-amber-50 text-amber-600 ring-amber-200' },
  { value: 'closed_won',     label: 'Closed Won',     color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { value: 'closed_lost',    label: 'Closed Lost',    color: 'bg-blush-50 text-blush-600 ring-blush-200' },
  { value: 'on_hold',        label: 'On Hold',        color: 'bg-gray-100 text-gray-400 ring-gray-200' },
]

const byValue = Object.fromEntries(STAGES.map(s => [s.value, s]))

export default function LeadStageDropdown({ prospect }: { prospect: Prospect }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Stage>(prospect.lead_stage ?? 'new_lead')
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  const stage = byValue[current]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(value: Stage) {
    if (value === current) { setOpen(false); return }
    setCurrent(value)
    setOpen(false)
    startTransition(() => updateLeadStage(prospect.id, value))
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset transition-opacity ${stage.color} ${isPending ? 'opacity-60' : 'hover:opacity-80 cursor-pointer'}`}
      >
        {stage.label}
        <ChevronDown size={11} className="opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[150px]">
          {STAGES.map(s => (
            <button
              key={s.value}
              onClick={() => select(s.value)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${s.value === current ? 'font-semibold text-brand-700' : 'text-gray-600'}`}
            >
              <span className={`inline-flex px-2 py-0.5 rounded-full ring-1 ring-inset text-xs ${s.color}`}>
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
