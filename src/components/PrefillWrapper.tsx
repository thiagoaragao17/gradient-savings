'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProspectForm from './ProspectForm'
import { createProspect } from '@/lib/actions'
import { decodeHelcimParam } from '@/lib/helcim-decode'
import type { Prospect } from '@/lib/types'

export default function PrefillWrapper() {
  const searchParams = useSearchParams()
  const [prefill, setPrefill] = useState<Partial<Prospect> | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Priority 1: bookmarklet passes data as ?helcim=BASE64
    const helcimParam = searchParams.get('helcim')
    if (helcimParam) {
      const decoded = decodeHelcimParam(helcimParam)
      if (decoded) {
        setPrefill(decoded as Partial<Prospect>)
        setReady(true)
        return
      }
    }

    // Priority 2: modal URL-parse flow stores data in sessionStorage
    const stored = sessionStorage.getItem('prospect_prefill')
    if (stored) {
      try {
        setPrefill(JSON.parse(stored))
      } catch { /* ignore */ }
      sessionStorage.removeItem('prospect_prefill')
    }
    setReady(true)
  }, [searchParams])

  if (!ready) return null

  return <ProspectForm action={createProspect} prospect={prefill as Prospect | null} />
}
