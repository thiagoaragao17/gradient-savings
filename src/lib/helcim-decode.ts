// Pure client-safe utility — no 'use server', no async, no Node APIs.
// Decodes the base64-encoded data passed from the bookmarklet via ?helcim= URL param.

import type { Prospect } from './types'

type ParsedProspect = Partial<Prospect>

// ── Copy of the helpers needed here (kept minimal) ────────────────────────────

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function num(v: unknown): number | undefined {
  const n = parseFloat(String(v ?? ''))
  return isNaN(n) ? undefined : n
}

function int(v: unknown): number | undefined {
  const n = parseInt(String(v ?? ''))
  return isNaN(n) ? undefined : n
}

function dig(obj: unknown, ...keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  for (const k of keys) {
    if (k in (obj as Record<string, unknown>)) return (obj as Record<string, unknown>)[k]
  }
  for (const v of Object.values(obj as object)) {
    const found = dig(v, ...keys)
    if (found !== undefined) return found
  }
  return undefined
}

function formatAddress(a: unknown): string | null {
  if (!a) return null
  if (typeof a === 'string') return a
  if (typeof a === 'object') {
    const o = a as Record<string, unknown>
    return [o.street || o.address1, o.city, o.state || o.province, o.zip || o.postalCode]
      .filter(Boolean).join(', ')
  }
  return null
}

const NET_MAP: Record<string, string> = {
  visa: 'visa', vi: 'visa',
  mastercard: 'mastercard', mc: 'mastercard',
  amex: 'amex', 'american express': 'amex', americanexpress: 'amex',
  discover: 'discover',
  pin_debit: 'pin_debit', 'pin debit': 'pin_debit', debit: 'pin_debit',
}

function normaliseInterchange(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.visa || o.mastercard || o.amex || o.discover || o.pin_debit) return o
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    const mapped = NET_MAP[k.toLowerCase()]
    if (mapped) out[mapped] = v
  }
  return Object.keys(out).length ? out : o
}

function extract(obj: Record<string, unknown>): ParsedProspect {
  const p: ParsedProspect = {}

  const cn = obj.companyName ?? obj.company_name ?? obj.businessName ?? obj.merchant_name
    ?? dig(obj, 'companyName', 'company_name', 'businessName')
  if (cn) p.company_name = titleCase(String(cn))

  const addr = obj.address ?? obj.companyAddress ?? obj.company_address
    ?? dig(obj, 'address', 'companyAddress')
  const formatted = formatAddress(addr)
  if (formatted) p.company_address = titleCase(formatted)

  const prov = obj.currentProvider ?? obj.current_provider ?? obj.processorName
    ?? dig(obj, 'currentProvider', 'processorName')
  if (prov) p.current_provider = String(prov)

  const dt = obj.statementDate ?? obj.statement_date ?? obj.period ?? obj.statementPeriod
    ?? dig(obj, 'statementDate', 'statementPeriod')
  if (dt) p.statement_date = String(dt)

  const vol = obj.totalVolume ?? obj.total_volume ?? obj.processingVolume
    ?? dig(obj, 'totalVolume', 'processingVolume')
  if (vol !== undefined) p.total_volume = num(vol)

  const txns = obj.totalTransactions ?? obj.total_transactions ?? obj.transactionCount
    ?? dig(obj, 'totalTransactions', 'transactionCount')
  if (txns !== undefined) p.total_transactions = int(txns)

  const env = obj.processingEnvironment ?? obj.processing_environment ?? obj.processingEnv
  const ipRaw = obj.inPersonPercentage ?? obj.inPersonPct ?? obj.in_person_pct
    ?? (env as Record<string, unknown>)?.inPerson ?? dig(obj, 'inPersonPercentage', 'inPersonPct')
  const ipPct = num(ipRaw)
  if (ipPct !== undefined) {
    p.processing_in_person_pct = ipPct
    p.processing_keyed_pct = 100 - ipPct
  } else {
    const kRaw = obj.keyedPercentage ?? obj.keyedPct ?? obj.keyed_pct
      ?? (env as Record<string, unknown>)?.keyed ?? (env as Record<string, unknown>)?.online
    const kPct = num(kRaw)
    if (kPct !== undefined) {
      p.processing_keyed_pct = kPct
      p.processing_in_person_pct = 100 - kPct
    }
  }

  const mix = obj.cardTypeMix ?? obj.card_type_mix ?? obj.cardMix
  const cons = obj.consumerPercentage ?? obj.card_consumer_pct
    ?? (mix as Record<string, unknown>)?.consumer ?? dig(obj, 'consumerPercentage', 'consumerPct')
  const prem = obj.premiumPercentage ?? obj.card_premium_pct
    ?? (mix as Record<string, unknown>)?.premium ?? dig(obj, 'premiumPercentage', 'premiumPct')
  const corp = obj.corporatePercentage ?? obj.card_corporate_pct
    ?? (mix as Record<string, unknown>)?.corporate ?? dig(obj, 'corporatePercentage', 'corporatePct')
  if (cons !== undefined) p.card_consumer_pct = num(cons)
  if (prem !== undefined) p.card_premium_pct = num(prem)
  if (corp !== undefined) p.card_corporate_pct = num(corp)

  const curCost = obj.currentMonthlyCost ?? obj.current_monthly_cost ?? obj.currentCost
    ?? dig(obj, 'currentMonthlyCost', 'currentCost')
  const newCost = obj.helcimMonthlyCost ?? obj.newMonthlyCost ?? obj.new_monthly_cost
    ?? obj.newCost ?? dig(obj, 'helcimMonthlyCost', 'newMonthlyCost', 'newCost')
  if (curCost !== undefined) p.current_monthly_cost = num(curCost)
  if (newCost !== undefined) p.new_monthly_cost = num(newCost)

  if (p.current_monthly_cost && p.new_monthly_cost) {
    p.monthly_savings = p.current_monthly_cost - p.new_monthly_cost
    p.annual_savings = p.monthly_savings * 12
  }

  const curRate = obj.currentEffectiveRate ?? obj.current_effective_rate ?? obj.effectiveRate
    ?? dig(obj, 'currentEffectiveRate', 'effectiveRate')
  const newRate = obj.newEffectiveRate ?? obj.new_effective_rate ?? obj.helcimEffectiveRate
    ?? dig(obj, 'newEffectiveRate', 'helcimEffectiveRate')
  if (curRate !== undefined) p.current_effective_rate = num(curRate)
  if (newRate !== undefined) p.new_effective_rate = num(newRate)

  const tier = obj.tier ?? obj.helcimTier ?? obj.pricingTier ?? dig(obj, 'tier', 'helcimTier')
  if (tier !== undefined) p.helcim_tier = int(tier) ?? 2

  const icRaw = obj.interchangeData ?? obj.interchange ?? obj.cardBreakdown
    ?? obj.cardNetworks ?? dig(obj, 'interchangeData', 'interchange', 'cardNetworks')
  if (icRaw) {
    const ic = normaliseInterchange(icRaw)
    if (ic) p.interchange_data = ic as Prospect['interchange_data']
  }

  return p
}

// ── Public decode function ────────────────────────────────────────────────────

export function decodeHelcimParam(b64: string): ParsedProspect | null {
  try {
    const json = JSON.parse(decodeURIComponent(escape(atob(b64))))
    if (!json || typeof json !== 'object') return null
    const data = extract(json as Record<string, unknown>)
    return (data.company_name || data.total_volume || data.current_monthly_cost) ? data : null
  } catch {
    return null
  }
}
