// Pure utility — no 'use server', safe to import anywhere.
// Parses Helcim comparison text extracted from a PDF (via unpdf / pdfjs-dist).
//
// IMPORTANT: unpdf with mergePages:true may produce text WITHOUT consistent newlines,
// so all patterns use \s+ (not \n) and are bounded by the NEXT known keyword to avoid
// greedily capturing the rest of the document.

import type { Prospect, InterchangeData, CardNetworkData, InterchangeRow } from './types'

export type ParsedProspect = Partial<Prospect> & { helcim_link?: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function parseMoney(s: string): number | undefined {
  const n = parseFloat(s.replace(/[$,\s]/g, ''))
  return isNaN(n) ? undefined : n
}

function parsePct(s: string): number | undefined {
  const n = parseFloat(s.replace('%', '').trim())
  return isNaN(n) ? undefined : n
}

// ── Interchange table parser ──────────────────────────────────────────────────

function parseNetworkSection(text: string): CardNetworkData {
  const rows: InterchangeRow[] = []

  // Skip the column header row ("Card Type Txns Volume Interchange Card Brand Helcim Cost")
  // so the non-greedy card_type doesn't swallow it as part of the first row's name.
  const headerMatch = text.match(/(?:Card\s+Type|CARD\s+TYPE)\s+Txns?\s+Volume\s+Interchange\s+Card\s+Brand\s+Helcim\s+Cost/i)
  const dataText = headerMatch ? text.slice(headerMatch.index! + headerMatch[0].length) : text

  // Each data row: {card_type} {txns} ${volume} {interchange%} {brand%} {helcim%} ${cost}
  // Non-greedy card_type stops at the first position where the rest of the pattern matches.
  // The $ anchor after txns prevents matching mid-name digits (e.g. "Level 2 Keyed").
  const rowRe = /(.+?)\s+(\d+)\s+\$([\d,]+\.\d{2})\s+([\d.]+%\s*\+\s*[\d]+[^\s]*)\s+([\d.]+%\s*\+\s*[\d]+[^\s]*)\s+([\d.]+%\s*\+\s*[\d]+[^\s]*)\s+\$([\d,]+\.\d{2})/g

  let m: RegExpExecArray | null
  while ((m = rowRe.exec(dataText)) !== null) {
    const cardType = m[1].trim()
    if (/card.?type|txns|volume|interchange/i.test(cardType)) continue
    rows.push({
      card_type: titleCase(cardType),
      txns: parseInt(m[2]),
      volume: parseFloat(m[3].replace(/,/g, '')),
      interchange_rate: m[4].trim(),
      card_brand_fee: m[5].trim(),
      gradient_fee: m[6].trim(),
      cost: parseFloat(m[7].replace(/,/g, '')),
    })
  }

  const totalsMatch = text.match(/Totals\s+(\d+)\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})/i)
  return {
    rows,
    total_txns:   totalsMatch ? parseInt(totalsMatch[1])                   : rows.reduce((s, r) => s + r.txns, 0),
    total_volume: totalsMatch ? parseFloat(totalsMatch[2].replace(/,/g, '')) : rows.reduce((s, r) => s + r.volume, 0),
    total_cost:   totalsMatch ? parseFloat(totalsMatch[3].replace(/,/g, '')) : rows.reduce((s, r) => s + r.cost, 0),
  }
}

function parseInterchangeData(text: string): InterchangeData | null {
  const sectionStart = text.search(/Interchange Cost Breakdown/i)
  if (sectionStart === -1) return null
  const section = text.slice(sectionStart)

  const networkDefs: { pattern: RegExp; key: keyof InterchangeData }[] = [
    { pattern: /\bVisa\b\s+(?:Card Type|CARD TYPE)/i,                              key: 'visa' },
    { pattern: /\bMastercard\b\s+(?:Card Type|CARD TYPE)/i,                        key: 'mastercard' },
    { pattern: /\bAmerican Express\b\s+(?:Card Type|CARD TYPE)/i,                  key: 'amex' },
    { pattern: /\bDiscover\b\s+(?:Card Type|CARD TYPE)/i,                          key: 'discover' },
    { pattern: /\bUs Common Pin Debit\b\s+(?:Card Type|CARD TYPE)/i,               key: 'pin_debit' },
  ]

  // Find start position of each network header within the interchange section
  const found: { key: keyof InterchangeData; start: number }[] = []
  for (const { pattern, key } of networkDefs) {
    const match = pattern.exec(section)
    if (match) found.push({ key, start: match.index })
  }
  found.sort((a, b) => a.start - b.start)

  const result: InterchangeData = {}
  for (let i = 0; i < found.length; i++) {
    const { key, start } = found[i]
    const end = i + 1 < found.length ? found[i + 1].start : section.length
    result[key] = parseNetworkSection(section.slice(start, end))
  }

  return Object.keys(result).length > 0 ? result : null
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseHelcimText(text: string): ParsedProspect {
  const p: ParsedProspect = {}

  // ── Company name & address ─────────────────────────────────────────────────
  // Everything before "Statement Comparison #NNNNN" is company header.
  // May contain: "DCG TECHNICAL SOLUTIONS 1043 FOOTHILL BLVD, LA CANADA FLINTRIDGE, CA 91011- 3249"
  const beforeComp = text.match(/^([\s\S]+?)\s*Statement Comparison\s*#/i)?.[1] ?? ''
  if (beforeComp) {
    // Find where street address starts: digits at the START of a token (not mid-word like "CYBER74")
    // (?<!\S) = preceded by whitespace or start of string
    const addrRe = /(?<!\S)(\d+\s+\S.*?\b(?:blvd|boulevard|st|street|ave|avenue|rd|road|dr|drive|ln|lane|way|ct|court|pl|place|ste|suite|hwy|highway)\b.*?)(?:\s+(?:helcim|statement|comparison|expiry|patrick|pmclellan|1-8|©)|\s*$)/i
    const addrMatch = beforeComp.match(addrRe)
    if (addrMatch) {
      const addrStart = beforeComp.indexOf(addrMatch[1])
      const namePart = beforeComp.slice(0, addrStart).trim()
      // Stitch split zip codes: "CA 91011- 3249" → "CA 91011-3249"
      const addrPart = addrMatch[1].replace(/(\d{5})-\s+(\d{4})/, '$1-$2').trim()
      if (namePart) p.company_name = titleCase(namePart)
      if (addrPart) p.company_address = titleCase(addrPart)
    } else {
      // No address found — treat whole thing as name (filter out known non-name lines)
      const nameLine = beforeComp
        .split(/\s{2,}|\n/)
        .map(s => s.trim())
        .filter(s => s.length > 2)
        .filter(s => !/^(helcim|statement|comparison|expiry|patrick|pmclellan|1-8)/i.test(s))
        .filter(s => !/^\d{1,4}$/.test(s))[0]
      if (nameLine) p.company_name = titleCase(nameLine)
    }
  }

  // ── Current provider — bounded by next keyword ─────────────────────────────
  const provMatch = text.match(/Current Provider\s+(.+?)\s+(?:Statement Date|Total Payment)/i)
  if (provMatch) p.current_provider = titleCase(provMatch[1].trim())

  // ── Statement date — bounded by next keyword ───────────────────────────────
  const stmtMatch = text.match(/Statement Date\s+(.+?)\s+Total Payment Volume/i)
  if (stmtMatch) p.statement_date = stmtMatch[1].trim()

  // ── Volume ─────────────────────────────────────────────────────────────────
  const volMatch = text.match(/Total Payment Volume\s+\$?([\d,]+(?:\.\d+)?)/i)
  if (volMatch) p.total_volume = parseMoney(volMatch[1])

  // ── Transactions ───────────────────────────────────────────────────────────
  const txnMatch = text.match(/Total Transactions\s+(\d[\d,]*)/i)
  if (txnMatch) p.total_transactions = parseInt(txnMatch[1].replace(/,/g, ''))

  // ── Processing environment ─────────────────────────────────────────────────
  const inPersonMatch = text.match(/Processing Environment\s+(\d+(?:\.\d+)?)%\s*In-Person/i)
  const keyedMatch = text.match(/(\d+(?:\.\d+)?)%\s*Keyed/i)
  if (inPersonMatch) p.processing_in_person_pct = parsePct(inPersonMatch[1])
  if (keyedMatch) p.processing_keyed_pct = parsePct(keyedMatch[1])
  if (p.processing_in_person_pct !== undefined && p.processing_keyed_pct === undefined)
    p.processing_keyed_pct = 100 - p.processing_in_person_pct
  if (p.processing_keyed_pct !== undefined && p.processing_in_person_pct === undefined)
    p.processing_in_person_pct = 100 - p.processing_keyed_pct

  // ── Card type mix — bounded to summary section, before interchange table ───
  // Use lookahead to stop before "Estimated Savings" or "Interchange Cost"
  const mixSection = text.match(/Card Type Mix\s+([\s\S]+?)(?=Estimated Savings|Interchange Cost|Current Monthly)/i)?.[1] ?? ''
  const consMatch = mixSection.match(/(\d+(?:\.\d+)?)%\s*Consumer/i)
    ?? text.match(/Card Type Mix\s+(\d+(?:\.\d+)?)%\s*Consumer/i)
  const premMatch = mixSection.match(/(\d+(?:\.\d+)?)%\s*Premium/i)
  const corpMatch = mixSection.match(/(\d+(?:\.\d+)?)%\s*Corporate/i)
  if (consMatch) p.card_consumer_pct = parsePct(consMatch[1])
  if (premMatch) p.card_premium_pct = parsePct(premMatch[1])
  if (corpMatch) p.card_corporate_pct = parsePct(corpMatch[1])

  // ── Costs — same-line pattern (works whether newlines present or not) ───────
  // "Current Monthly Cost $3,616.57" or "Current Monthly Cost\n$3,616.57"
  const curCostMatch = text.match(/Current Monthly Cost[\s\n]+\$?([\d,]+(?:\.\d+)?)/i)
  if (curCostMatch) p.current_monthly_cost = parseMoney(curCostMatch[1])

  const newCostMatch = text.match(/Helcim Monthly Cost[\s\n]+\$?([\d,]+(?:\.\d+)?)/i)
  if (newCostMatch) p.new_monthly_cost = parseMoney(newCostMatch[1])

  // ── Effective rates ────────────────────────────────────────────────────────
  const curRateMatch = text.match(/Current Effective Rate[\s\n]+([\d.]+)%/i)
  if (curRateMatch) p.current_effective_rate = parsePct(curRateMatch[1])

  const newRateMatch = text.match(/Helcim Effective Rate[\s\n]+([\d.]+)%/i)
  if (newRateMatch) p.new_effective_rate = parsePct(newRateMatch[1])

  // ── Savings ────────────────────────────────────────────────────────────────
  const monthlySavMatch = text.match(/Monthly Savings\s+\$?([\d,]+(?:\.\d+)?)/i)
  if (monthlySavMatch) p.monthly_savings = parseMoney(monthlySavMatch[1])

  const annualSavMatch = text.match(/Annual Savings[:\s]+\$?([\d,]+(?:\.\d+)?)/i)
  if (annualSavMatch) p.annual_savings = parseMoney(annualSavMatch[1])

  if (p.current_monthly_cost && p.new_monthly_cost) {
    if (!p.monthly_savings) p.monthly_savings = p.current_monthly_cost - p.new_monthly_cost
    if (!p.annual_savings) p.annual_savings = p.monthly_savings * 12
  }

  // ── Helcim comparison number ───────────────────────────────────────────────
  const compNumMatch = text.match(/Statement Comparison\s+#(\d+)/i)
  if (compNumMatch) p.helcim_comparison_number = parseInt(compNumMatch[1])

  // ── Tier ───────────────────────────────────────────────────────────────────
  const tierMatch = text.match(/\bTier\s+([1-5])\b/i)
  if (tierMatch) p.helcim_tier = parseInt(tierMatch[1])

  // ── Interchange breakdown ──────────────────────────────────────────────────
  const interchange = parseInterchangeData(text)
  if (interchange) p.interchange_data = interchange

  return p
}
