'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import Tooltip from './Tooltip'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Tooltip label={copied ? 'Copied!' : 'Copy shareable link'}>
      <button
        onClick={handleCopy}
        className="p-1.5 text-brand-400 hover:text-brand-600 transition-colors"
      >
        {copied ? <Check size={15} className="text-brand-500" /> : <Link2 size={15} />}
      </button>
    </Tooltip>
  )
}
