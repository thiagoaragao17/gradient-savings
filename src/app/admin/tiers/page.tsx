import { US_TIERS, CA_TIERS, ACH_RATES, FEE_SAVER_US, FEE_SAVER_CA, HELCIM_NOTES } from '@/lib/helcim-tiers'
import { Info } from 'lucide-react'

function TierTable({ tiers, showInterac }: { tiers: typeof US_TIERS; showInterac?: boolean }) {
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
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400 text-xs font-bold">
                    —
                  </span>
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

function SectionHeader({ flag, country }: { flag: string; country: string }) {
  return (
    <div className="flex items-center gap-3 pt-4">
      <span className="text-2xl">{flag}</span>
      <h2 className="text-lg font-semibold text-gray-900">{country}</h2>
    </div>
  )
}

export default function TiersPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Helcim Tiers &amp; Rates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Interchange-plus pricing by monthly processing volume. Verified from Helcim partner pricing tool.
        </p>
      </div>

      {/* ── United States ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader flag="🇺🇸" country="United States" />

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Credit Cards (Interchange+)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Gradient MSP markup only. Final cost = Interchange + Card brand fee + Gradient fee.</p>
          </div>
          <TierTable tiers={US_TIERS} />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">ACH Bank Payments</h3>
              <p className="text-xs text-gray-400 mt-0.5">Flat rate — no volume tiers.</p>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600">{ACH_RATES.standard.description}</p>
                <p className="text-sm font-mono font-bold text-gray-800 shrink-0">
                  {ACH_RATES.standard.rate} + {ACH_RATES.standard.perTxn}
                  <span className="ml-2 text-xs font-normal text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">cap {ACH_RATES.standard.cap}</span>
                </p>
              </div>
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600">{ACH_RATES.large.description}</p>
                <p className="text-sm font-mono font-bold text-gray-800 shrink-0">{ACH_RATES.large.rate}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Surcharging (Fee Saver)</h3>
            </div>
            <FeeSaverCard
              inPerson={FEE_SAVER_US.customerRateInPerson}
              online={FEE_SAVER_US.customerRateOnline}
              note={FEE_SAVER_US.note}
            />
          </section>
        </div>
      </div>

      {/* ── Canada ────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader flag="🇨🇦" country="Canada" />

        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Credit Cards + Interac Debit (Interchange+)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Credit card rates identical to US. Interac debit is a flat per-transaction fee with no percentage component.</p>
          </div>
          <TierTable tiers={CA_TIERS} showInterac />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">EFT-PAD Bank Payments</h3>
              <p className="text-xs text-gray-400 mt-0.5">Flat rate — no volume tiers. Same rates as US ACH.</p>
            </div>
            <div className="divide-y divide-gray-50">
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600">{ACH_RATES.standard.description}</p>
                <p className="text-sm font-mono font-bold text-gray-800 shrink-0">
                  {ACH_RATES.standard.rate} + {ACH_RATES.standard.perTxn}
                  <span className="ml-2 text-xs font-normal text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">cap {ACH_RATES.standard.cap}</span>
                </p>
              </div>
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600">{ACH_RATES.large.description}</p>
                <p className="text-sm font-mono font-bold text-gray-800 shrink-0">{ACH_RATES.large.rate}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Surcharging (Fee Saver)</h3>
            </div>
            <FeeSaverCard
              inPerson={FEE_SAVER_CA.customerRateInPerson}
              online={FEE_SAVER_CA.customerRateOnline}
              note={FEE_SAVER_CA.note}
            />
          </section>
        </div>
      </div>

      {/* ── Fee Schedule ─────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Fee Schedule</h3>
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

      {/* ── Notes ────────────────────────────────────────────────────────────── */}
      <section className="bg-brand-50 border border-brand-100 rounded-xl p-5 space-y-2.5">
        <div className="flex items-center gap-2 mb-1">
          <Info size={14} className="text-brand-500 shrink-0" />
          <h3 className="text-sm font-semibold text-brand-800">Notes</h3>
        </div>
        {HELCIM_NOTES.map((note, i) => (
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
