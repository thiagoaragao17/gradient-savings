'use client'

import { useState } from 'react'
import Image from 'next/image'
import { US_TIERS, CA_TIERS, INTERCHANGE, INTERCHANGE_UPDATED } from '@/lib/helcim-tiers'

type Country = 'us' | 'ca'
type Tab = 'in-person' | 'keyed' | 'ach' | 'fee-saver'

// Major breakpoints + 2 intermediate stops between each
const SLIDER_POINTS = [
  5000, 20000, 35000,          // $5K → $50K
  50000, 65000, 80000,         // $50K → $100K
  100000, 200000, 350000,      // $100K → $500K
  500000, 650000, 800000,      // $500K → $1M
  1000000, 2000000, 3500000,   // $1M → $5M+
  5000000,
]

const MAJOR_INDICES = [0, 3, 6, 9, 12, 15]
const MAJOR_LABELS: Record<number, string> = {
  0: '$5K', 3: '$50K', 6: '$100K', 9: '$500K', 12: '$1M', 15: '$5M+',
}

function getActiveTier(volume: number, country: Country) {
  const tiers = country === 'us' ? US_TIERS : CA_TIERS
  return tiers.find(t => volume >= t.volumeMin && volume <= t.volumeMax) ?? tiers[0]
}

function formatVolume(v: number) {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M`
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
  return `$${v}`
}

// Parse "0.40% + 8¢" → { pct: 0.40, cents: 8 } or null if Custom
function parseRate(rate: string): { pct: number; cents: number } | null {
  const m = rate.match(/^(\d+\.?\d*)%\s*\+\s*(\d+)¢$/)
  if (!m) return null
  return { pct: parseFloat(m[1]), cents: parseInt(m[2]) }
}

// Compute effective rate = interchange + markup (cents shown separately, not folded in)
function effectiveRate(
  markupStr: string,
  interchangePct: number,
): { pct: string; cents: number } | null {
  const markup = parseRate(markupStr)
  if (!markup) return null
  return { pct: (interchangePct + markup.pct).toFixed(2), cents: markup.cents }
}

export default function PricingToolClient() {
  const [country, setCountry] = useState<Country>('us')
  const [tab, setTab] = useState<Tab>('in-person')
  const [sliderIdx, setSliderIdx] = useState(0)

  const volume = SLIDER_POINTS[sliderIdx]
  const tiers = country === 'us' ? US_TIERS : CA_TIERS
  const activeTier = getActiveTier(volume, country)
  const isCA = country === 'ca'
  const icx = INTERCHANGE[country]

  const TABS: { key: Tab; label: string }[] = [
    { key: 'in-person', label: 'In-Person' },
    { key: 'keyed',     label: 'Keyed & Online' },
    { key: 'ach',       label: isCA ? 'ACH / EFT-PAD' : 'ACH' },
    { key: 'fee-saver', label: 'Surcharging (Fee Saver)' },
  ]

  const usInPerson = INTERCHANGE.us.inPerson

  // Always two main columns (Visa/MC/Disc + Amex) — matches Helcim layout
  const inPersonCols: Col[] = [
    {
      effective: effectiveRate(activeTier.inPerson, icx.inPerson.visaMcDiscover),
      logos: [
        { src: '/visa.svg',       alt: 'Visa',       w: 44, h: 28 },
        { src: '/mastercard.svg', alt: 'Mastercard', w: 44, h: 28 },
        { src: '/discover.svg',   alt: 'Discover',   w: 44, h: 28 },
      ],
    },
    {
      effective: effectiveRate(activeTier.inPerson, icx.inPerson.amex),
      logos: [{ src: '/amex.svg', alt: 'American Express', w: 44, h: 28 }],
    },
    ...(isCA
      ? [{ flat: activeTier.interac ?? '9¢', logos: [{ src: '/interac.svg', alt: 'Interac', w: 44, h: 28 }] }]
      : [{ effective: effectiveRate(activeTier.inPerson, usInPerson.pinDebit), label: 'PIN Debit', logos: [] as Logo[] }]
    ),
  ]

  const keyedCols: Col[] = [
    {
      effective: effectiveRate(activeTier.keyed, icx.keyed.visaMcDiscover),
      logos: [
        { src: '/visa.svg',       alt: 'Visa',       w: 44, h: 28 },
        { src: '/mastercard.svg', alt: 'Mastercard', w: 44, h: 28 },
        { src: '/discover.svg',   alt: 'Discover',   w: 44, h: 28 },
      ],
    },
    {
      effective: effectiveRate(activeTier.keyed, icx.keyed.amex),
      logos: [{ src: '/amex.svg', alt: 'American Express', w: 44, h: 28 }],
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

      {/* Header + country toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pricing Tool</h1>
          <p className="text-sm text-gray-500 mt-1">
            Interactive rate reference by volume and processing type.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
          {(['us', 'ca'] as Country[]).map(c => (
            <button
              key={c}
              onClick={() => setCountry(c)}
              className={`flex items-center justify-center w-10 h-10 rounded-lg text-xl transition-all ${
                country === c ? 'bg-white shadow-sm' : 'hover:bg-white/60'
              }`}
            >
              {c === 'us' ? '🇺🇸' : '🇨🇦'}
            </button>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Tab strip */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Rate display */}
        {tab === 'in-person' && <RateDisplay cols={inPersonCols} />}
        {tab === 'keyed' && <RateDisplay cols={keyedCols} />}
        {tab === 'ach' && <AchDisplay isCA={isCA} />}
        {tab === 'fee-saver' && <FeeSaverDisplay isCA={isCA} />}

        {/* Slider — shown for card tabs */}
        {(tab === 'in-person' || tab === 'keyed') && (
          <div className="px-8 pb-8 pt-2">
            <div className="relative mt-8 mb-2">
              {/* Volume bubble above thumb */}
              <div
                className="absolute -top-8 transition-all duration-200"
                style={{
                  left: `${(sliderIdx / (SLIDER_POINTS.length - 1)) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="bg-brand-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md whitespace-nowrap">
                  {formatVolume(volume)}
                </div>
                {/* Caret */}
                <div className="w-2 h-2 bg-brand-600 rotate-45 mx-auto -mt-1 rounded-sm" />
              </div>

              {/* Track */}
              <div className="h-2 rounded-full bg-gray-100 relative shadow-inner">
                <div
                  className="h-2 rounded-full transition-all duration-200"
                  style={{
                    width: `${(sliderIdx / (SLIDER_POINTS.length - 1)) * 100}%`,
                    background: 'linear-gradient(to right, #5da09d, #3d6562)',
                    boxShadow: '0 1px 6px 0 rgba(78,127,123,0.45)',
                  }}
                />
              </div>

              {/* Snap-point dots */}
              <div className="absolute inset-0 flex items-center justify-between">
                {SLIDER_POINTS.map((_, i) => {
                  const isMajor = MAJOR_INDICES.includes(i)
                  const active = i <= sliderIdx
                  const isCurrent = i === sliderIdx
                  return (
                    <button
                      key={i}
                      onClick={() => setSliderIdx(i)}
                      className={`rounded-full border-2 transition-all ${
                        isMajor ? 'w-3.5 h-3.5' : 'w-2 h-2'
                      } ${
                        isCurrent
                          ? 'bg-white border-brand-600 shadow-md scale-125'
                          : active
                          ? 'bg-brand-500 border-brand-500'
                          : 'bg-white border-gray-200 hover:border-brand-400'
                      }`}
                    />
                  )
                })}
              </div>

              {/* Hidden range input for drag */}
              <input
                type="range"
                min={0}
                max={SLIDER_POINTS.length - 1}
                step={1}
                value={sliderIdx}
                onChange={e => setSliderIdx(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-6 -top-2"
              />
            </div>

            {/* Labels — only at major breakpoints */}
            <div className="relative mt-2" style={{ height: '20px' }}>
              {MAJOR_INDICES.map(i => (
                <span
                  key={i}
                  className={`absolute text-xs transition-colors -translate-x-1/2 ${
                    sliderIdx >= i && (MAJOR_INDICES[MAJOR_INDICES.indexOf(i) + 1] === undefined || sliderIdx < MAJOR_INDICES[MAJOR_INDICES.indexOf(i) + 1])
                      ? 'text-brand-600 font-semibold'
                      : 'text-gray-400'
                  }`}
                  style={{ left: `${(i / (SLIDER_POINTS.length - 1)) * 100}%` }}
                >
                  {MAJOR_LABELS[i]}
                </span>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center mt-3">
              Select your monthly volume to see your rate tier
            </p>
          </div>
        )}

        {/* Tier table */}
        {(tab === 'in-person' || tab === 'keyed') && (
          <div className="border-t border-gray-100">
            <div className="px-6 py-3 bg-gray-50 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Effective rate (Visa/MC)
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly volume</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount tier</span>
            </div>
            <div className="divide-y divide-gray-50">
              {tiers.filter(t => t.tier <= 6).map(t => {
                const isActive = t.tier === activeTier.tier
                const markupStr = tab === 'in-person' ? t.inPerson : t.keyed
                const icxPct = tab === 'in-person' ? icx.inPerson.visaMcDiscover : icx.keyed.visaMcDiscover
                const eff = effectiveRate(markupStr, icxPct)
                const displayRate = eff ? `${eff.pct}% + ${eff.cents}¢` : 'Custom rates'
                return (
                  <div
                    key={t.tier}
                    className={`px-6 py-3 flex justify-between items-center transition-colors ${
                      isActive ? 'bg-brand-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-mono ${isActive ? 'font-semibold text-brand-700' : 'text-gray-600'}`}>
                      {displayRate}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      isActive ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {t.volumeRange}
                    </span>
                    <span className={`text-sm font-semibold w-6 text-center ${isActive ? 'text-brand-700' : 'text-gray-400'}`}>
                      {t.tier <= 5 ? t.tier : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-panels ─────────────────────────────────────────────────────────────────

type Logo = { src: string; alt: string; w: number; h: number }

interface Col {
  logos: Logo[]
  effective?: { pct: string; cents: number } | null
  flat?: string        // Interac — just a cents string like "9¢"
  label?: string       // optional sub-label (e.g. "PIN Debit")
}

function RateDisplay({ cols }: { cols: Col[] }) {
  return (
    <div className="px-8 pt-6 pb-4">
      <h2 className="text-center text-lg font-semibold text-gray-900 mb-6">Interchange plus pricing</h2>

      <div
        className="grid divide-x divide-gray-100"
        style={{ gridTemplateColumns: `repeat(${cols.length}, 1fr)` }}
      >
        {cols.map((col, i) => (
          <div key={i} className="text-center px-6 pb-6">
            {col.flat ? (
              <div className="flex items-start justify-center">
                <span className="text-5xl font-extrabold text-gray-900 tracking-tight leading-none">
                  {col.flat.replace('¢', '')}
                </span>
                <span className="text-2xl font-bold text-gray-500 mt-1">¢</span>
              </div>
            ) : col.effective ? (
              <div className="flex items-start justify-center gap-0.5">
                <span className="text-5xl font-extrabold text-gray-900 tracking-tight leading-none">
                  {col.effective.pct}
                </span>
                <div className="flex flex-col items-start mt-1">
                  <span className="text-lg font-bold text-gray-900 leading-none">%</span>
                  <span className="text-sm font-bold text-gray-500 leading-none mt-0.5">+{col.effective.cents}¢</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-14">
                <span className="text-xl font-semibold text-gray-400">Custom</span>
              </div>
            )}

            {col.logos.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {col.logos.map(logo => (
                  <Image key={logo.alt} src={logo.src} alt={logo.alt} width={logo.w} height={logo.h} className="rounded" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center mt-2">
        Estimated effective rate based on a typical card mix — includes interchange, card brand fees, and Gradient markup.
      </p>
      <p className="text-[11px] text-gray-300 text-center mt-1">
        Interchange rates last updated {INTERCHANGE_UPDATED}. Card networks revise these every April &amp; October.
      </p>
    </div>
  )
}

function AchDisplay({ isCA }: { isCA: boolean }) {
  return (
    <div className="px-8 py-10 space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Accept {isCA ? 'EFT-PAD' : 'ACH'} bank payments
        </h2>
        <p className="text-sm text-gray-400">
          Save on card processing fees by accepting {isCA ? 'pre-authorized debit payments' : 'ACH payments'}.
        </p>
      </div>
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-sm text-gray-500">Per transaction between $0 – $25,000</p>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-gray-900">0.5<span className="text-lg">%</span> <span className="text-2xl font-bold text-gray-500">+ 25<span className="text-base">¢</span></span></p>
            <p className="text-xs text-brand-600 font-semibold mt-0.5">Capped at $6</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-sm text-gray-500">Per transaction over $25,000+</p>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-gray-900">+ 0.05<span className="text-lg">%</span></p>
            <p className="text-xs text-gray-400 mt-0.5">On amount over $25k</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeeSaverDisplay({ isCA }: { isCA: boolean }) {
  const inPersonRate = isCA ? '2.4%' : '3.0%'
  return (
    <div className="px-8 py-10 space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Pass credit card fees to customers</h2>
        <p className="text-sm text-gray-400">Compliant surcharging and online convenience fees on eligible accounts.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-gray-100 rounded-xl px-6 py-6 text-center">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">You pay</p>
          <p className="text-6xl font-extrabold text-brand-600">0<span className="text-3xl">%</span></p>
          <p className="text-xs text-gray-400 mt-3">On credit card transactions</p>
        </div>
        <div className="border border-gray-100 rounded-xl px-6 py-6 text-center space-y-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Your customers pay</p>
          <div>
            <p className="text-4xl font-extrabold text-gray-900">{inPersonRate}<span className="text-lg text-gray-400">*</span></p>
            <p className="text-xs text-gray-400 mt-1">In-person transactions</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-gray-900">3.0<span className="text-lg">%</span><span className="text-lg text-gray-400">*</span></p>
            <p className="text-xs text-gray-400 mt-1">Online transactions</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">*3% in most cases — can vary by card type and international transactions.</p>
    </div>
  )
}
