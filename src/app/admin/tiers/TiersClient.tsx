'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import type { HelcimTier } from '@/lib/helcim-tiers'

interface AchRates {
  standard: { rate: string; perTxn: string; cap: string; description: string }
  large: { rate: string; perTxn: null; cap: null; description: string }
}

interface FeeSaver {
  merchantRate: string
  customerRateInPerson: string
  customerRateOnline: string
  note: string
}

interface Props {
  usTiers: HelcimTier[]
  caTiers: HelcimTier[]
  achRates: AchRates
  feeSaverUS: FeeSaver
  feeSaverCA: FeeSaver
  notes: string[]
}

function TierTable({ tiers, showInterac }: { tiers: HelcimTier[]; showInterac?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Tier</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Volume</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">In-Person</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Keyed / Online</th>
            {showInterac && (
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Interac Debit</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {tiers.map((t) => (
            <tr key={t.tier} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                {t.tier <= 5 ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                    {t.tier}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400 text-xs font-bold">—</span>
                )}
              </td>
              <td className="px-6 py-4 font-medium text-gray-900">{t.volumeRange}</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{t.inPerson}</td>
              <td className="px-6 py-4 text-right font-mono text-gray-800">{t.keyed}</td>
              {showInterac && (
                <td className="px-6 py-4 text-right font-mono text-gray-800">{t.interac ?? '—'}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FeeSaverCard({ inPerson, online, note }: { inPerson: string; online: string; note: string }) {
  return (
    <>
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        <div className="px-6 py-5 text-center">
          <p className="text-xs text-gray-400 mb-2">You pay</p>
          <p className="text-4xl font-extrabold text-brand-600">0%</p>
          <p className="text-xs text-gray-400 mt-1">On credit card transactions</p>
        </div>
        <div className="px-6 py-5 text-center">
          <p className="text-xs text-gray-400 mb-2">Your customers pay</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-3xl font-extrabold text-gray-800">{inPerson}</p>
              <p className="text-xs text-gray-400 mt-0.5">In-person</p>
            </div>
            <div className="text-gray-200 text-2xl font-light">/</div>
            <div>
              <p className="text-3xl font-extrabold text-gray-800">{online}</p>
              <p className="text-xs text-gray-400 mt-0.5">Online</p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">*{note}</p>
      </div>
    </>
  )
}

export default function TiersClient({ usTiers, caTiers, achRates, feeSaverUS, feeSaverCA, notes }: Props) {
  const [country, setCountry] = useState<'us' | 'ca'>('us')

  const tiers = country === 'us' ? usTiers : caTiers
  const feeSaver = country === 'us' ? feeSaverUS : feeSaverCA
  const isCA = country === 'ca'

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

      {/* Header + flag toggle */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Helcim Tiers &amp; Rates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Interchange-plus pricing by monthly processing volume. Verified from Helcim partner pricing tool.
          </p>
        </div>

        {/* Country toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setCountry('us')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              country === 'us'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-lg">🇺🇸</span>
            <span>United States</span>
          </button>
          <button
            onClick={() => setCountry('ca')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              country === 'ca'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-lg">🇨🇦</span>
            <span>Canada</span>
          </button>
        </div>
      </div>

      {/* Credit cards */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Credit Cards (Interchange+)</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isCA
              ? 'Credit card rates identical to US. Interac debit is a flat per-transaction fee — no percentage component.'
              : 'Gradient MSP markup only. Final cost = Interchange + Card brand fee + Gradient fee.'}
          </p>
        </div>
        <TierTable tiers={tiers} showInterac={isCA} />
      </section>

      {/* ACH / EFT-PAD + Fee Saver */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">{isCA ? 'EFT-PAD Bank Payments' : 'ACH Bank Payments'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Flat rate — no volume tiers.</p>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">{achRates.standard.description}</p>
              <p className="text-sm font-mono font-bold text-gray-800 shrink-0">
                {achRates.standard.rate} + {achRates.standard.perTxn}
                <span className="ml-2 text-xs font-normal text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  cap {achRates.standard.cap}
                </span>
              </p>
            </div>
            <div className="px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-gray-600">{achRates.large.description}</p>
              <p className="text-sm font-mono font-bold text-gray-800 shrink-0">{achRates.large.rate}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Surcharging (Fee Saver)</h2>
          </div>
          <FeeSaverCard
            inPerson={feeSaver.customerRateInPerson}
            online={feeSaver.customerRateOnline}
            note={feeSaver.note}
          />
        </section>
      </div>

      {/* Fee schedule */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Fee Schedule</h2>
          <p className="text-xs text-gray-400 mt-0.5">Applies to both US and Canada.</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Monthly fee',      value: '$0',  note: 'No monthly or maintenance fee' },
            { label: 'PCI compliance',   value: '$0',  note: 'Included at no charge' },
            { label: 'Statement fee',    value: '$0',  note: 'No paper or e-statement fee' },
            { label: 'Cancellation fee', value: '$0',  note: 'No contract, cancel any time' },
            { label: 'Setup fee',        value: '$0',  note: 'No onboarding or setup cost' },
            { label: 'Chargeback fee',   value: '$15', note: 'Per dispute filed' },
            { label: 'NSF / return',     value: '$25', note: 'Per returned ACH / EFT-PAD / NSF event' },
          ].map(({ label, value, note }) => (
            <div key={label} className="px-6 py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{note}</p>
              </div>
              <p className={`text-sm font-bold shrink-0 ${value === '$0' ? 'text-brand-600' : 'text-gray-800'}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="bg-brand-50 border border-brand-100 rounded-xl p-5 space-y-2.5">
        <div className="flex items-center gap-2 mb-1">
          <Info size={14} className="text-brand-500 shrink-0" />
          <h2 className="text-sm font-semibold text-brand-800">Notes</h2>
        </div>
        {notes.map((note, i) => (
          <p key={i} className="text-xs text-brand-700 leading-relaxed pl-5">• {note}</p>
        ))}
        <p className="text-xs text-brand-500 pl-5 pt-1">
          Verify at{' '}
          <a href="https://pricing.helcim.com/tools/pricing/partner" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-700">
            pricing.helcim.com/tools/pricing/partner
          </a>
        </p>
      </section>

    </div>
  )
}
