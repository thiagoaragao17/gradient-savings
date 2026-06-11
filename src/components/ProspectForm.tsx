'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Prospect } from '@/lib/types'

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function detectTier(volume: number) {
  if (volume < 50000) return 1
  if (volume < 100000) return 2
  if (volume < 500000) return 3
  if (volume < 1000000) return 4
  return 5
}

interface Props {
  prospect?: Prospect | null
  action: (prev: { error: string } | null, formData: FormData) => Promise<{ error: string } | null>
}

export default function ProspectForm({ prospect, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null)

  const [companyName, setCompanyName] = useState(prospect?.company_name ?? '')
  const [slug, setSlug] = useState(prospect?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!prospect?.slug)
  const [totalVolume, setTotalVolume] = useState(prospect?.total_volume?.toString() ?? '')
  const [tier, setTier] = useState(prospect?.helcim_tier?.toString() ?? '2')
  const [currentCost, setCurrentCost] = useState(prospect?.current_monthly_cost?.toString() ?? '')
  const [newCost, setNewCost] = useState(prospect?.new_monthly_cost?.toString() ?? '')
  const [monthlySavings, setMonthlySavings] = useState(prospect?.monthly_savings?.toFixed(2) ?? '')
  const [annualSavings, setAnnualSavings] = useState(prospect?.annual_savings?.toFixed(2) ?? '')

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(companyName))
  }, [companyName, slugEdited])

  useEffect(() => {
    const vol = parseFloat(totalVolume)
    if (!isNaN(vol)) setTier(detectTier(vol).toString())
  }, [totalVolume])

  useEffect(() => {
    const curr = parseFloat(currentCost)
    const next = parseFloat(newCost)
    if (!isNaN(curr) && !isNaN(next)) {
      const monthly = curr - next
      setMonthlySavings(monthly.toFixed(2))
      setAnnualSavings((monthly * 12).toFixed(2))
    }
  }, [currentCost, newCost])

  const defaultExpiry = prospect?.expiry_date
    ? prospect.expiry_date.slice(0, 10)
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const interchangePlaceholder = `{
  "visa": {
    "rows": [
      {
        "card_type": "VI Credit CPS Keyed",
        "txns": 5,
        "volume": 5959.33,
        "interchange_rate": "1.80% + 10¢",
        "card_brand_fee": "0.22% + 3¢",
        "gradient_fee": "0.45% + 20¢",
        "cost": 148.98
      }
    ],
    "total_txns": 5,
    "total_volume": 5959.33,
    "total_cost": 148.98
  }
}`

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-blush-50 border border-blush-200 text-blush-600 text-sm px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      {/* Company */}
      <FormSection title="Company">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name" required>
            <input
              name="company_name"
              required
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className={input}
              placeholder="Decision Digital Inc"
            />
          </Field>
          <Field label="Address">
            <input
              name="company_address"
              defaultValue={prospect?.company_address ?? ''}
              className={input}
              placeholder="6105 Blue Stone Rd, Atlanta, GA"
            />
          </Field>
        </div>
      </FormSection>

      {/* Statement Context */}
      <FormSection title="Statement Context">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Current Provider" required>
            <input
              name="current_provider"
              required
              defaultValue={prospect?.current_provider ?? ''}
              className={input}
              placeholder="Global Payments"
            />
          </Field>
          <Field label="Statement Date" required>
            <input
              name="statement_date"
              required
              defaultValue={prospect?.statement_date ?? ''}
              className={input}
              placeholder="April 2026"
            />
          </Field>
          <Field label="Total Volume ($)" required>
            <input
              name="total_volume"
              type="number"
              step="0.01"
              min="0"
              required
              value={totalVolume}
              onChange={e => setTotalVolume(e.target.value)}
              className={input}
              placeholder="77446.31"
            />
          </Field>
          <Field label="Total Transactions" required>
            <input
              name="total_transactions"
              type="number"
              min="0"
              required
              defaultValue={prospect?.total_transactions ?? ''}
              className={input}
              placeholder="54"
            />
          </Field>
        </div>
      </FormSection>

      {/* Processing Profile */}
      <FormSection title="Processing Profile" hint="Percentages within each group should total 100.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="In-Person (%)">
            <input
              name="processing_in_person_pct"
              type="number"
              min="0"
              max="100"
              defaultValue={prospect?.processing_in_person_pct ?? 0}
              className={input}
              placeholder="0"
            />
          </Field>
          <Field label="Keyed (%)">
            <input
              name="processing_keyed_pct"
              type="number"
              min="0"
              max="100"
              defaultValue={prospect?.processing_keyed_pct ?? 0}
              className={input}
              placeholder="100"
            />
          </Field>
          <Field label="Consumer (%)">
            <input
              name="card_consumer_pct"
              type="number"
              min="0"
              max="100"
              defaultValue={prospect?.card_consumer_pct ?? 0}
              className={input}
              placeholder="40"
            />
          </Field>
          <Field label="Premium (%)">
            <input
              name="card_premium_pct"
              type="number"
              min="0"
              max="100"
              defaultValue={prospect?.card_premium_pct ?? 0}
              className={input}
              placeholder="10"
            />
          </Field>
          <Field label="Corporate (%)">
            <input
              name="card_corporate_pct"
              type="number"
              min="0"
              max="100"
              defaultValue={prospect?.card_corporate_pct ?? 0}
              className={input}
              placeholder="50"
            />
          </Field>
        </div>
      </FormSection>

      {/* Cost Comparison */}
      <FormSection title="Cost Comparison">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Current Monthly Cost ($)" required>
            <input
              name="current_monthly_cost"
              type="number"
              step="0.01"
              min="0"
              required
              value={currentCost}
              onChange={e => setCurrentCost(e.target.value)}
              className={input}
              placeholder="2767.83"
            />
          </Field>
          <Field label="New Monthly Cost ($)" required>
            <input
              name="new_monthly_cost"
              type="number"
              step="0.01"
              min="0"
              required
              value={newCost}
              onChange={e => setNewCost(e.target.value)}
              className={input}
              placeholder="1857.16"
            />
          </Field>
          <Field label="Current Effective Rate (%)" required>
            <input
              name="current_effective_rate"
              type="number"
              step="0.001"
              min="0"
              required
              defaultValue={prospect?.current_effective_rate ?? ''}
              className={input}
              placeholder="3.57"
            />
          </Field>
          <Field label="New Effective Rate (%)" required>
            <input
              name="new_effective_rate"
              type="number"
              step="0.001"
              min="0"
              required
              defaultValue={prospect?.new_effective_rate ?? ''}
              className={input}
              placeholder="2.40"
            />
          </Field>
          <Field label="Monthly Savings ($)" hint="Auto-calculated">
            <input
              name="monthly_savings"
              type="number"
              step="0.01"
              value={monthlySavings}
              readOnly
              className={`${input} bg-brand-50 text-brand-600 cursor-default`}
            />
          </Field>
          <Field label="Annual Savings ($)" hint="Auto-calculated">
            <input
              name="annual_savings"
              type="number"
              step="0.01"
              value={annualSavings}
              readOnly
              className={`${input} bg-brand-50 text-brand-600 cursor-default`}
            />
          </Field>
        </div>
      </FormSection>

      {/* Link Settings */}
      <FormSection title="Link Settings">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="URL Slug" required hint="Auto-generated — edit to customise">
            <div className="flex items-stretch">
              <span className="px-3 flex items-center bg-brand-50 border border-r-0 border-brand-200 rounded-l-lg text-brand-500 text-sm whitespace-nowrap">
                /p/
              </span>
              <input
                name="slug"
                required
                value={slug}
                onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
                className={`${input} rounded-l-none`}
                placeholder="decision-digital"
              />
            </div>
          </Field>
          <Field label="Expiry Date" required>
            <input
              name="expiry_date"
              type="date"
              required
              defaultValue={defaultExpiry}
              className={input}
            />
          </Field>
          <Field label="Pricing Tier (1–5)" hint="Auto-detected from volume">
            <input
              name="helcim_tier"
              type="number"
              min="1"
              max="5"
              value={tier}
              onChange={e => setTier(e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={prospect?.status ?? 'active'} className={input}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </Field>
          <Field label="Sign-Up URL" hint="Leave blank to hide the button">
            <input
              name="signup_url"
              type="url"
              defaultValue={prospect?.signup_url ?? ''}
              className={input}
              placeholder="https://app.helcim.com/signup?..."
            />
          </Field>
          <input
            type="hidden"
            name="helcim_comparison_number"
            value={prospect?.helcim_comparison_number ?? ''}
          />
          <Field label="Original Helcim Link" hint="Optional reference">
            <input
              name="helcim_link"
              type="url"
              defaultValue={prospect?.helcim_link ?? ''}
              className={input}
              placeholder="https://pricing.helcim.com/comparison/..."
            />
          </Field>
        </div>
      </FormSection>

      {/* Rep / Contact */}
      <FormSection title="Your Contact Info" hint="Shown on the prospect page as the point of contact. All fields optional.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input
              name="rep_name"
              defaultValue={prospect?.rep_name ?? 'Colin Knox'}
              className={input}
              placeholder="Jane Smith"
            />
          </Field>
          <Field label="Email">
            <input
              name="rep_email"
              type="email"
              defaultValue={prospect?.rep_email ?? 'colin.knox@meetgradient.com'}
              className={input}
              placeholder="jane@yourcompany.com"
            />
          </Field>
          <Field label="Photo URL or path" hint="e.g. /avatars/colin-knox.png">
            <input
              name="rep_photo"
              defaultValue={prospect?.rep_photo ?? ''}
              className={input}
              placeholder="/avatars/colin-knox.png"
            />
          </Field>
        </div>
      </FormSection>

      {/* Interchange Data */}
      <FormSection
        title="Interchange Breakdown"
        hint="Optional — paste JSON from the Helcim PDF. Leave blank to show only the summary numbers."
      >
        <textarea
          name="interchange_json"
          rows={10}
          defaultValue={
            prospect?.interchange_data && Object.keys(prospect.interchange_data).length > 0
              ? JSON.stringify(prospect.interchange_data, null, 2)
              : ''
          }
          className={`${input} font-mono text-xs leading-relaxed resize-y`}
          placeholder={interchangePlaceholder}
        />
      </FormSection>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end pb-8">
        <Link
          href="/admin"
          className="px-4 py-2.5 text-sm text-brand-600 hover:text-brand-800 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? 'Saving…' : prospect ? 'Save Changes' : 'Create Prospect'}
          {!pending && <ChevronRight size={15} />}
        </button>
      </div>
    </form>
  )
}

// ── Primitives ─────────────────────────────────────────────────────────────────

const input =
  'w-full px-3.5 py-2.5 rounded-lg border border-brand-200 text-brand-900 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white ' +
  'placeholder:text-brand-300'

function FormSection({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-brand-100 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-brand-900">{title}</h2>
        {hint && <p className="text-xs text-brand-500 mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-800 mb-1.5">
        {label}
        {required && <span className="text-blush-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-brand-400 mt-1">{hint}</p>}
    </div>
  )
}
