import { getProspectBySlug } from '@/lib/actions'
import { HELCIM_TIERS } from '@/lib/helcim-tiers'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import ViewTracker from './ViewTracker'
import ProspectCTA from './ProspectCTA'
import SavingsPanel from './SavingsPanel'
import type { Prospect, CardNetworkData } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const prospect = await getProspectBySlug(slug)
  if (!prospect) return {}
  return {
    title: `Payment Analysis — ${prospect.company_name}`,
    description: `Estimated annual savings: $${prospect.annual_savings.toLocaleString('en-US')}`,
  }
}

export default async function ProspectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const prospect = await getProspectBySlug(slug)
  if (!prospect) notFound()

  const isExpired =
    prospect.status !== 'active' || new Date(prospect.expiry_date) < new Date()

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const networks = [
    { key: 'visa',       label: 'Visa' },
    { key: 'mastercard', label: 'Mastercard' },
    { key: 'amex',       label: 'American Express' },
    { key: 'discover',   label: 'Discover' },
    { key: 'pin_debit',  label: 'US Common PIN Debit' },
  ] as const

  const tiers = HELCIM_TIERS.map(t => ({ tier: t.tier, range: t.volumeRange, inPerson: t.inPerson, keyed: t.keyed }))

  const hasInterchange =
    prospect.interchange_data &&
    Object.values(prospect.interchange_data).some(n => n && (n as CardNetworkData).rows?.length > 0)

  return (
    <div className="min-h-screen bg-white">
      <ViewTracker prospectId={prospect.id} />

      {/* Print-only header */}
      <div className="hidden print:flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <Image src="/logo-header.svg" alt="Gradient MSP" width={140} height={35} />
        <div className="text-right">
          <p className="font-bold text-gray-900 uppercase tracking-wide">{prospect.company_name}</p>
          <p className="text-xs text-gray-400">Payment Analysis · {fmtDate(prospect.expiry_date)}</p>
        </div>
      </div>

      {isExpired && (
        <div className="bg-blush-100 border-b border-blush-200 text-blush-600 text-sm text-center py-2 px-4 no-print">
          This quote has expired. Please contact Gradient Payments for an updated analysis.
        </div>
      )}

      {/* ── Sticky header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 no-print">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <Image src="/logo-header.svg" alt="Gradient MSP" width={160} height={40} priority />
            <div className="hidden md:block h-5 w-px bg-gray-200" />
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{prospect.company_name}</p>
              <p className="text-xs text-gray-400">
                Payment Analysis · Valid through {fmtDate(prospect.expiry_date)}
              </p>
            </div>
          </div>
          <ProspectCTA signupUrl={prospect.signup_url} compact />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Two-column section ─────────────────────────────────────────────── */}
        <div className="prospect-columns flex flex-col lg:flex-row gap-8 items-stretch">

          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* 1. Prospect information */}
            <section className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <p className="font-bold text-gray-900 text-lg uppercase tracking-wide">{prospect.company_name}</p>
                {prospect.company_address && (
                  <p className="text-sm text-gray-400 mt-0.5">{prospect.company_address}</p>
                )}
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <SummaryRow label="Current Provider" value={prospect.current_provider} />
                <SummaryRow
                  label="Processing Environment"
                  value={
                    prospect.processing_in_person_pct === 0
                      ? '100% Keyed / Online'
                      : prospect.processing_keyed_pct === 0
                      ? '100% In-Person'
                      : `${prospect.processing_in_person_pct}% In-Person / ${prospect.processing_keyed_pct}% Keyed`
                  }
                />
                <SummaryRow label="Statement Date" value={prospect.statement_date} />
                <SummaryRow
                  label="Card Type Mix"
                  value={[
                    prospect.card_consumer_pct > 0 ? `${prospect.card_consumer_pct}% Consumer` : null,
                    prospect.card_premium_pct > 0 ? `${prospect.card_premium_pct}% Premium` : null,
                    prospect.card_corporate_pct > 0 ? `${prospect.card_corporate_pct}% Corporate` : null,
                  ].filter(Boolean).join(' / ')}
                />
                <SummaryRow label="Total Payment Volume" value={`$${fmt(prospect.total_volume)}`} />
                <SummaryRow label="Total Transactions" value={prospect.total_transactions.toLocaleString('en-US')} />
              </div>
            </section>

            {/* 2. Gradient Rates */}
            <section className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Gradient Payments Rates</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Interchange+ Tier Discount Floor — Visa, Mastercard, Discover, American Express
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-brand-500 text-white rounded-full">
                  Tier {prospect.helcim_tier}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3 font-semibold">Tier</th>
                    <th className="text-left px-6 py-3 font-semibold">Monthly Volume</th>
                    <th className="text-right px-6 py-3 font-semibold">In-Person</th>
                    <th className="text-right px-6 py-3 font-semibold">Keyed / Online</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map(t => (
                    <tr
                      key={t.tier}
                      className={
                        t.tier === prospect.helcim_tier
                          ? 'bg-brand-50 border-l-2 border-brand-500'
                          : 'border-b border-gray-50'
                      }
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">{t.tier}</td>
                      <td className="px-6 py-3 text-gray-500">{t.range}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">{t.inPerson}</td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">{t.keyed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-t border-gray-100">
                <div className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">0% Fee Saver Rate</p>
                  <p className="text-xs text-gray-400 mt-0.5">Credit card fees passed to customers via surcharging</p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">No Extra Fees</p>
                  <p className="text-xs text-gray-400 mt-0.5">No minimums, PCI, or statement fees</p>
                </div>
              </div>
            </section>


          </div>

          {/* Right column — sticky savings panel */}
          <div className="prospect-sidebar w-full lg:w-80 xl:w-96 shrink-0 flex flex-col">
            <SavingsPanel prospect={prospect} />
          </div>

        </div>

        {/* ── 4. Full-width interchange breakdown ────────────────────────────── */}
        {hasInterchange && (
          <section className="break-before">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Interchange Cost Breakdown</h2>
            <div className="space-y-5">
              {networks.map(({ key, label }) => {
                const network = prospect.interchange_data?.[key] as CardNetworkData | undefined
                if (!network?.rows?.length) return null
                return <NetworkTable key={key} label={label} network={network} />
              })}
            </div>
          </section>
        )}

        {/* ── CTAs ───────────────────────────────────────────────────────────── */}
        <ProspectCTA signupUrl={prospect.signup_url} />

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer className="border-t border-gray-100 pt-6 pb-4 space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            All pricing quoted in USD. This quote is valid for 90 days and is based on statements
            and information provided by you. The quote is an estimate only and not a guarantee.
            Interchange and card brand fees listed are a rough estimate of anticipated costs.
            Monthly savings are based on estimated monthly savings multiplied by twelve. Full terms
            of service and pricing details are available at{' '}
            <a href="https://legal.helcim.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
              legal.helcim.com
            </a>
            . New applicants are subject to conditions and approval. © {new Date().getFullYear()} Gradient Payments. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 opacity-50">
            <Image src="/logo-footer.svg" alt="Gradient MSP" width={110} height={22} />
            <span className="text-xs text-gray-400 flex items-center gap-1.5">Powered by <Image src="/helcim-logo.svg" alt="Helcim" width={46} height={14} className="opacity-70" /></span>
          </div>
        </footer>

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function NetworkTable({ label, network }: { label: string; network: CardNetworkData }) {
  const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="text-left px-4 py-2.5 font-semibold">Card Type</th>
              <th className="text-right px-4 py-2.5 font-semibold">Txns</th>
              <th className="text-right px-4 py-2.5 font-semibold">Volume</th>
              <th className="text-right px-4 py-2.5 font-semibold">Interchange</th>
              <th className="text-right px-4 py-2.5 font-semibold">Card Brand</th>
              <th className="text-right px-4 py-2.5 font-semibold"><Image src="/logo-header.svg" alt="Gradient" width={70} height={18} /></th>
              <th className="text-right px-4 py-2.5 font-semibold">Cost</th>
            </tr>
          </thead>
          <tbody>
            {network.rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2.5 text-gray-700">{row.card_type}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{row.txns}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">${fmt(row.volume)}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{row.interchange_rate}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{row.card_brand_fee}</td>
                <td className="px-4 py-2.5 text-right text-gray-500">{row.gradient_fee}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-gray-900">${fmt(row.cost)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold text-gray-900">
              <td className="px-4 py-2.5">Totals</td>
              <td className="px-4 py-2.5 text-right">{network.total_txns}</td>
              <td className="px-4 py-2.5 text-right">${fmt(network.total_volume)}</td>
              <td colSpan={3} />
              <td className="px-4 py-2.5 text-right">${fmt(network.total_cost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
