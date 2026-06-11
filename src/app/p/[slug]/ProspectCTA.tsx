'use client'

import { Download, ArrowRight } from 'lucide-react'

export default function ProspectCTA({
  signupUrl,
  compact = false,
}: {
  signupUrl: string | null
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 no-print">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Download PDF</span>
        </button>
        {signupUrl ? (
          <a
            href={signupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Get Started
            <ArrowRight size={14} />
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-200 text-brand-400 text-sm font-medium rounded-lg cursor-not-allowed"
          >
            Get Started
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4 no-print">
      <button
        onClick={() => window.print()}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
      >
        <Download size={16} />
        Download PDF
      </button>
      {signupUrl ? (
        <a
          href={signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Get Started
          <ArrowRight size={16} />
        </a>
      ) : (
        <button
          disabled
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-200 text-brand-400 text-sm font-medium rounded-xl cursor-not-allowed"
        >
          Get Started
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  )
}
