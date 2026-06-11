'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { ChevronDown, Circle } from 'lucide-react'
import { updateProspectStatus } from '@/lib/actions'
import type { Prospect } from '@/lib/types'

type Status = Prospect['status']

const OPTIONS: { value: Status; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
]

const STYLES: Record<Status, { badge: string; dot: string }> = {
  active:   { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'text-emerald-500' },
  inactive: { badge: 'bg-gray-100 text-gray-500 ring-gray-200',         dot: 'text-gray-400' },
  expired:  { badge: 'bg-blush-50 text-blush-600 ring-blush-200',       dot: 'text-blush-400' },
}

export default function StatusDropdown({ prospect }: { prospect: Prospect }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Status>(prospect.status)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  // Derive display label — opened/not-opened is read-only, status change is separate
  const isOpened = prospect.view_count > 0
  const displayLabel =
    current === 'active'
      ? isOpened ? 'Opened' : 'Not Opened'
      : current === 'expired'
      ? 'Expired'
      : 'Inactive'

  const displayStyle =
    current === 'active'
      ? isOpened
        ? { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'text-emerald-500' }
        : { badge: 'bg-amber-50 text-amber-600 ring-amber-200', dot: 'text-amber-400' }
      : STYLES[current]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function select(value: Status) {
    if (value === current) { setOpen(false); return }
    setCurrent(value)
    setOpen(false)
    startTransition(() => updateProspectStatus(prospect.id, value))
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset transition-opacity ${displayStyle.badge} ${isPending ? 'opacity-60' : 'hover:opacity-80 cursor-pointer'}`}
      >
        <Circle size={6} className={`${displayStyle.dot} fill-current`} />
        {displayLabel}
        <ChevronDown size={11} className="opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[130px]">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => select(opt.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors ${opt.value === current ? 'font-semibold text-brand-700' : 'text-gray-600'}`}
            >
              <Circle size={6} className={`${STYLES[opt.value].dot} fill-current`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
