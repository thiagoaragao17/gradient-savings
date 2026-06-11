'use client'

import { useEffect, useRef } from 'react'
import { logProspectView } from '@/lib/actions'

export default function ViewTracker({ prospectId }: { prospectId: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    logProspectView(prospectId).catch(() => {})
  }, [prospectId])

  return null
}
