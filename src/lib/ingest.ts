'use server'

import type { Prospect } from './types'

type ParsedProspect = Partial<Prospect> & { helcim_link?: string }

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// Recursively find the first value for any of the given keys
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

// ── Address ───────────────────────────────────────────────────────────────────

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

// ── Interchange normaliser ────────────────────────────────────────────────────

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
  // Already in our format?
  if (o.visa || o.mastercard || o.amex || o.discover || o.pin_debit) return o
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    const mapped = NET_MAP[k.toLowerCase()]
    if (mapped) out[mapped] = v
  }
  return Object.keys(out).length ? out : o
}

// ── Core extractor ────────────────────────────────────────────────────────────

function extract(obj: Record<string, unknown>): ParsedProspect {
  const p: ParsedProspect = {}

  // Company
  const cn = obj.companyName ?? obj.company_name ?? obj.businessName ?? obj.merchant_name
    ?? dig(obj, 'companyName', 'company_name', 'businessName')
  if (cn) p.company_name = titleCase(String(cn))

  const addr = obj.address ?? obj.companyAddress ?? obj.company_address
    ?? dig(obj, 'address', 'companyAddress')
  const formatted = formatAddress(addr)
  if (formatted) p.company_address = titleCase(formatted)

  // Provider
  const prov = obj.currentProvider ?? obj.current_provider ?? obj.processorName ?? obj.processor
    ?? dig(obj, 'currentProvider', 'processorName')
  if (prov) p.current_provider = String(prov)

  // Statement date
  const dt = obj.statementDate ?? obj.statement_date ?? obj.period ?? obj.statementPeriod
    ?? dig(obj, 'statementDate', 'statementPeriod')
  if (dt) p.statement_date = String(dt)

  // Volume & transactions
  const vol = obj.totalVolume ?? obj.total_volume ?? obj.processingVolume
    ?? dig(obj, 'totalVolume', 'processingVolume')
  if (vol !== undefined) p.total_volume = num(vol)

  const txns = obj.totalTransactions ?? obj.total_transactions ?? obj.transactionCount
    ?? dig(obj, 'totalTransactions', 'transactionCount')
  if (txns !== undefined) p.total_transactions = int(txns)

  // Processing environment
  const env = obj.processingEnvironment ?? obj.processing_environment ?? obj.processingEnv
  const ipRaw = obj.inPersonPercentage ?? obj.inPersonPct ?? obj.in_person_pct
    ?? (env as Record<string, unknown>)?.inPerson ?? (env as Record<string, unknown>)?.in_person
    ?? dig(obj, 'inPersonPercentage', 'inPersonPct')
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

  // Card mix
  const mix = obj.cardTypeMix ?? obj.card_type_mix ?? obj.cardMix
  const cons = obj.consumerPercentage ?? obj.card_consumer_pct
    ?? (mix as Record<string, unknown>)?.consumer
    ?? dig(obj, 'consumerPercentage', 'consumerPct')
  const prem = obj.premiumPercentage ?? obj.card_premium_pct
    ?? (mix as Record<string, unknown>)?.premium
    ?? dig(obj, 'premiumPercentage', 'premiumPct')
  const corp = obj.corporatePercentage ?? obj.card_corporate_pct
    ?? (mix as Record<string, unknown>)?.corporate
    ?? dig(obj, 'corporatePercentage', 'corporatePct')
  if (cons !== undefined) p.card_consumer_pct = num(cons)
  if (prem !== undefined) p.card_premium_pct = num(prem)
  if (corp !== undefined) p.card_corporate_pct = num(corp)

  // Costs
  const curCost = obj.currentMonthlyCost ?? obj.current_monthly_cost ?? obj.currentCost
    ?? dig(obj, 'currentMonthlyCost', 'currentCost')
  const newCost = obj.helcimMonthlyCost ?? obj.newMonthlyCost ?? obj.new_monthly_cost
    ?? obj.gradientMonthlyCost ?? obj.newCost
    ?? dig(obj, 'helcimMonthlyCost', 'newMonthlyCost', 'newCost')
  if (curCost !== undefined) p.current_monthly_cost = num(curCost)
  if (newCost !== undefined) p.new_monthly_cost = num(newCost)

  if (p.current_monthly_cost && p.new_monthly_cost) {
    p.monthly_savings = p.current_monthly_cost - p.new_monthly_cost
    p.annual_savings = p.monthly_savings * 12
  }

  // Rates
  const curRate = obj.currentEffectiveRate ?? obj.current_effective_rate ?? obj.effectiveRate
    ?? dig(obj, 'currentEffectiveRate', 'effectiveRate')
  const newRate = obj.newEffectiveRate ?? obj.new_effective_rate ?? obj.helcimEffectiveRate
    ?? dig(obj, 'newEffectiveRate', 'helcimEffectiveRate')
  if (curRate !== undefined) p.current_effective_rate = num(curRate)
  if (newRate !== undefined) p.new_effective_rate = num(newRate)

  // Tier
  const tier = obj.tier ?? obj.helcimTier ?? obj.pricingTier ?? dig(obj, 'tier', 'helcimTier')
  if (tier !== undefined) p.helcim_tier = int(tier) ?? 2

  // Interchange
  const icRaw = obj.interchangeData ?? obj.interchange ?? obj.cardBreakdown
    ?? obj.cardNetworks ?? dig(obj, 'interchangeData', 'interchange', 'cardNetworks')
  if (icRaw) {
    const ic = normaliseInterchange(icRaw)
    if (ic) p.interchange_data = ic as Prospect['interchange_data']
  }

  return p
}

// ── Candidate search ──────────────────────────────────────────────────────────

function findComparison(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>
  const candidates = [
    o?.props?.pageProps?.comparison,
    o?.props?.pageProps?.data,
    o?.props?.pageProps?.comparisonData,
    o?.props?.pageProps,
    dig(o, 'comparison'),
    dig(o, 'comparisonData'),
    dig(o, 'pageData'),
  ]
  for (const c of candidates) {
    if (c && typeof c === 'object') {
      const ex = extract(c as Record<string, unknown>)
      if (ex.company_name || ex.current_monthly_cost || ex.total_volume) return c as Record<string, unknown>
    }
  }
  return null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const JSON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, */*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
}

// Extract the comparison UUID from a URL path
function extractId(url: string): string | null {
  const m = url.match(/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/?$/)
  return m ? m[1] : null
}

// Fetch JSON from a URL, returns null if anything goes wrong
async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  try {
    const res = await fetch(url, { headers: { ...JSON_HEADERS, ...headers }, cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Fetch plain text, returns null on failure
async function fetchText(url: string, headers: Record<string, string> = {}): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': JSON_HEADERS['User-Agent'],
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
        ...headers,
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// Get the Next.js build ID from any HTML page on the same origin
async function getNextBuildId(origin: string): Promise<string | null> {
  // Try the homepage first (usually not bot-protected)
  const html = await fetchText(origin + '/')
  if (!html) return null
  const m = html.match(/"buildId"\s*:\s*"([^"]+)"/)
  return m ? m[1] : null
}

// ── Public server action ──────────────────────────────────────────────────────

export async function ingestFromUrl(
  url: string
): Promise<{ data?: ParsedProspect; error?: string }> {
  try {
    const id = extractId(url)
    const origin = new URL(url).origin
    const referer = url

    // ── Strategy 1: Next.js /_next/data JSON endpoint ─────────────────────────
    // Next.js exposes page props as /_next/data/{buildId}/{path}.json
    // This endpoint often bypasses Cloudflare bot protection on the HTML page.
    if (id) {
      const buildId = await getNextBuildId(origin)
      if (buildId) {
        const dataUrl = `${origin}/_next/data/${buildId}/comparison/${id}.json`
        const json = await fetchJson(dataUrl, { Referer: referer })
        if (json) {
          const comp = findComparison(json)
          if (comp) {
            const data = extract(comp)
            data.helcim_link = url
            if (data.company_name || data.total_volume) return { data }
          }
        }
      }
    }

    // ── Strategy 2: Candidate REST / tRPC API endpoints ───────────────────────
    if (id) {
      const apiCandidates = [
        `${origin}/api/comparisons/${id}`,
        `${origin}/api/comparison/${id}`,
        `${origin}/api/v1/comparisons/${id}`,
        `https://api.helcim.com/v1/comparisons/${id}`,
        `https://api.helcim.com/comparisons/${id}`,
      ]
      for (const endpoint of apiCandidates) {
        const json = await fetchJson(endpoint, { Referer: referer })
        if (!json) continue
        const comp = findComparison(json)
        const data = comp
          ? extract(comp)
          : typeof json === 'object'
          ? extract(json as Record<string, unknown>)
          : null
        if (data && (data.company_name || data.total_volume)) {
          data.helcim_link = url
          return { data }
        }
      }
    }

    // ── Strategy 3: Fetch the HTML page directly ──────────────────────────────
    const html = await fetchText(url)
    if (html) {
      // __NEXT_DATA__
      const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
      if (match) {
        try {
          const nextData = JSON.parse(match[1])
          const comp = findComparison(nextData)
          if (comp) {
            const data = extract(comp)
            data.helcim_link = url
            if (data.company_name || data.total_volume) return { data }
          }
        } catch { /* fall through */ }
      }

      // Any JSON blob in a script tag
      for (const [, content] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
        const trimmed = content.trim()
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) continue
        try {
          const obj = JSON.parse(trimmed)
          const comp = findComparison(obj)
          if (comp) {
            const data = extract(comp)
            data.helcim_link = url
            if (data.company_name || data.total_volume) return { data }
          }
        } catch { /* continue */ }
      }
    }

    return {
      error:
        'Could not extract data automatically. The comparison page may be protected. ' +
        'Try opening the link in your browser to verify it is accessible, then paste it again. ' +
        'or fill the form manually.',
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error while fetching URL' }
  }
}
