import { HELCIM_TIERS, HELCIM_NOTES } from '@/lib/helcim-tiers'
import { Info } from 'lucide-react'

export default function TiersPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Helcim Tiers &amp; Rates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Interchange-plus pricing by monthly processing volume. Used as the source of truth when generating quotes.
        </p>
      </div>

      {/* Main rates table */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Partner Pricing (Interchange+)</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Gradient MSP fees added on top of Visa/Mastercard/Amex interchange and card brand fees.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Volume</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">In-Person (chip/tap)</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Keyed / Online</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {HELCIM_TIERS.map((t) => (
                <tr key={t.tier} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                      {t.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{t.volumeRange}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-800">{t.inPerson}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-800">{t.keyed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Rates shown are the <strong className="text-gray-600">Gradient MSP markup</strong> component only. Final cost = Interchange + Card brand fee + Gradient fee.
          </p>
        </div>
      </section>

      {/* Debit note */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Debit Cards</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Tier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Volume</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">In-Person</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Keyed / Online</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                { tier: 1, range: '$0 – $50k',     inPerson: '0.15% + 8¢', keyed: '0.20% + 25¢' },
                { tier: 2, range: '$50k – $100k',  inPerson: '0.12% + 7¢', keyed: '0.15% + 20¢' },
                { tier: 3, range: '$100k – $500k', inPerson: '0.10% + 7¢', keyed: '0.12% + 20¢' },
                { tier: 4, range: '$500k – $1M',   inPerson: '0.08% + 6¢', keyed: '0.10% + 15¢' },
                { tier: 5, range: '$1M+',          inPerson: '0.05% + 6¢', keyed: '0.08% + 15¢' },
              ].map((t) => (
                <tr key={t.tier} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                      {t.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{t.range}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-800">{t.inPerson}</td>
                  <td className="px-6 py-4 text-right font-mono text-gray-800">{t.keyed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Debit interchange is regulated (Durbin Amendment) and typically <strong className="text-gray-600">much lower</strong> than credit interchange. With Fee Saver surcharging, debit is the only card type that retains a cost.
          </p>
        </div>
      </section>

      {/* Fee schedule */}
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Fee Schedule</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Monthly fee',       value: '$0',   note: 'No monthly or maintenance fee' },
            { label: 'PCI compliance',    value: '$0',   note: 'Included at no charge' },
            { label: 'Statement fee',     value: '$0',   note: 'No paper or e-statement fee' },
            { label: 'Cancellation fee',  value: '$0',   note: 'No contract, cancel any time' },
            { label: 'Setup fee',         value: '$0',   note: 'No onboarding or setup cost' },
            { label: 'Chargeback fee',    value: '$15',  note: 'Per dispute filed' },
            { label: 'NSF / return',      value: '$25',  note: 'Per returned ACH / NSF event' },
          ].map(({ label, value, note }) => (
            <div key={label} className="px-6 py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{note}</p>
              </div>
              <p className={`text-sm font-bold shrink-0 ${value === '$0' ? 'text-brand-600' : 'text-gray-800'}`}>
                {value}
              </p>
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
        {HELCIM_NOTES.map((note, i) => (
          <p key={i} className="text-xs text-brand-700 leading-relaxed pl-5">• {note}</p>
        ))}
        <p className="text-xs text-brand-500 pl-5 pt-1">
          Verify current rates at{' '}
          <a href="https://pricing.helcim.com/tools/pricing/partner" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-700">
            pricing.helcim.com/tools/pricing/partner
          </a>
          {' '}and{' '}
          <a href="https://pricing.helcim.com/tools/compare" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-700">
            pricing.helcim.com/tools/compare
          </a>
        </p>
      </section>

    </div>
  )
}
