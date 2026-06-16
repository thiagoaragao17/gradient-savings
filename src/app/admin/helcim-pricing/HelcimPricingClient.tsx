'use client'

import { useEffect, useRef } from 'react'

export default function HelcimPricingClient() {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === 'helcim-iframe-resize') {
        const iframe = iframeRef.current
        if (iframe) iframe.style.height = event.data.height + 'px'
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Helcim Pricing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Helcim&apos;s live partner pricing tool, embedded directly from their site.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-2">
        <iframe
          ref={iframeRef}
          id="helcim-tool"
          src="https://pricing.helcim.com/tools/pricing"
          scrolling="no"
          style={{ width: '100%', border: 'none', overflow: 'hidden', minHeight: 600 }}
        />
      </div>

      <p className="text-xs text-gray-400">
        Note: Helcim only renders this iframe on domains they&apos;ve approved. If it appears blank,
        the current domain still needs to be registered with Helcim.
      </p>
    </div>
  )
}
