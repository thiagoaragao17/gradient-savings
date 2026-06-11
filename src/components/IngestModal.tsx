'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, FileText, Loader2, CheckCircle2, AlertCircle, ChevronRight, Upload } from 'lucide-react'
import { ingestFromPdf } from '@/lib/ingest-pdf'

type Step = 'upload' | 'loading' | 'success' | 'error'

const LOADING_STEPS = [
  'Reading PDF…',
  'Extracting company data…',
  'Parsing interchange breakdown…',
  'Calculating savings…',
]

export default function IngestModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()

  const [step, setStep] = useState<Step>('upload')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [loadingIdx, setLoadingIdx] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [, startTransition] = useTransition()
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function clearTimers() {
    timerRefs.current.forEach(clearTimeout)
    timerRefs.current = []
  }

  function animateLoading(onDone: () => void) {
    setLoadingIdx(0)
    LOADING_STEPS.forEach((_, i) => {
      const t = setTimeout(() => setLoadingIdx(i), i * 600)
      timerRefs.current.push(t)
    })
    const done = setTimeout(onDone, LOADING_STEPS.length * 600 + 200)
    timerRefs.current.push(done)
  }

  function handleParsePdf() {
    if (!pdfFile) return
    setStep('loading')
    clearTimers()

    let result: { data?: unknown; error?: string } | null = null
    let animationDone = false
    let requestDone = false

    function tryFinish() {
      if (!animationDone || !requestDone || !result) return
      if (result.error) {
        setErrorMsg(result.error)
        setStep('error')
      } else {
        sessionStorage.setItem('prospect_prefill', JSON.stringify(result.data))
        setStep('success')
      }
    }

    animateLoading(() => { animationDone = true; tryFinish() })

    startTransition(async () => {
      const fd = new FormData()
      fd.append('pdf', pdfFile)
      result = await ingestFromPdf(fd)
      requestDone = true
      tryFinish()
    })
  }

  function handleContinue() {
    onClose()
    router.push('/admin/new')
  }

  function handleManual() {
    onClose()
    router.push('/admin/new')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: 'modal-in 200ms cubic-bezier(.4,0,.2,1)' }}
      >
        <style>{`
          @keyframes modal-in {
            from { opacity: 0; transform: scale(0.95) translateY(8px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes step-in {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .step-in { animation: step-in 220ms ease forwards; }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-semibold text-brand-900">New Prospect</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          {/* ── Upload ── */}
          {step === 'upload' && (
            <div className="step-in space-y-4">
              <p className="text-sm text-gray-500">
                Download the PDF from the Helcim comparison page, then upload it here to auto-fill all fields.
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (file?.type === 'application/pdf' || file?.name.endsWith('.pdf')) setPdfFile(file)
                }}
                className="w-full border-2 border-dashed border-brand-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
              >
                {pdfFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={18} className="text-brand-500" />
                    <span className="text-sm font-medium text-brand-700">{pdfFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload size={22} className="text-brand-300 mx-auto mb-2" />
                    <p className="text-sm text-brand-400">Click to select PDF</p>
                    <p className="text-xs text-brand-300 mt-0.5">or drag and drop</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {/* ── Loading ── */}
          {step === 'loading' && (
            <div className="step-in py-4">
              <div className="flex flex-col items-center gap-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}
                >
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
                <div className="w-full space-y-2.5">
                  {LOADING_STEPS.map((label, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 transition-all duration-300"
                      style={{ opacity: i <= loadingIdx ? 1 : 0.25 }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                        style={{
                          background: i < loadingIdx ? '#22c55e'
                            : i === loadingIdx ? 'linear-gradient(135deg, #5b21b6, #7c3aed)'
                            : '#e5e7eb',
                        }}
                      >
                        {i < loadingIdx ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : i === loadingIdx ? (
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-300" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="step-in py-2 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-brand-900 text-lg">Data extracted!</p>
                <p className="text-sm text-gray-500 mt-1">All fields have been pre-populated. Review and save the prospect.</p>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {step === 'error' && (
            <div className="step-in space-y-4">
              <div className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-100">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">

          {step === 'upload' && (
            <>
              <button
                onClick={handleManual}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Fill manually
              </button>
              <button
                onClick={handleParsePdf}
                disabled={!pdfFile}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
              >
                Import PDF
                <ChevronRight size={15} />
              </button>
            </>
          )}

          {step === 'loading' && (
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-300 text-white text-sm font-medium rounded-lg cursor-not-allowed"
            >
              <Loader2 size={14} className="animate-spin" />
              Parsing…
            </button>
          )}

          {step === 'success' && (
            <button
              onClick={handleContinue}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Review & Save
              <ChevronRight size={15} />
            </button>
          )}

          {step === 'error' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep('upload')}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Try Again
                <Upload size={14} />
              </button>
              <button
                onClick={handleManual}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Fill manually
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
