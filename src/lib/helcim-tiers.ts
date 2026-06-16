export interface HelcimTier {
  tier: number
  volumeRange: string
  volumeMin: number
  volumeMax: number
  inPerson: string
  keyed: string
  interac?: string  // Canada only — flat per-transaction Interac debit
}

// Credit card rates are identical between US and Canada
const CREDIT_TIERS: HelcimTier[] = [
  { tier: 1, volumeRange: '$0 – $50K',     volumeMin: 0,       volumeMax: 49999,    inPerson: '0.40% + 8¢',  keyed: '0.50% + 25¢' },
  { tier: 2, volumeRange: '$50K – $100K',  volumeMin: 50000,   volumeMax: 99999,    inPerson: '0.35% + 7¢',  keyed: '0.45% + 20¢' },
  { tier: 3, volumeRange: '$100K – $500K', volumeMin: 100000,  volumeMax: 499999,   inPerson: '0.25% + 7¢',  keyed: '0.35% + 20¢' },
  { tier: 4, volumeRange: '$500K – $1M',   volumeMin: 500000,  volumeMax: 999999,   inPerson: '0.20% + 6¢',  keyed: '0.25% + 15¢' },
  { tier: 5, volumeRange: '$1M – $5M',     volumeMin: 1000000, volumeMax: 5000000,  inPerson: '0.15% + 6¢',  keyed: '0.15% + 15¢' },
  { tier: 6, volumeRange: '$5M+',          volumeMin: 5000001, volumeMax: Infinity, inPerson: 'Custom',       keyed: 'Custom'       },
]

export const US_TIERS: HelcimTier[] = CREDIT_TIERS

export const CA_TIERS: HelcimTier[] = CREDIT_TIERS.map((t, i) => ({
  ...t,
  interac: ['9¢', '8¢', '8¢', '7¢', '7¢', 'Custom'][i],
}))

// Convenience alias used by the prospect page (US tiers)
export const HELCIM_TIERS = US_TIERS

export const ACH_RATES = {
  standard: { rate: '0.5%', perTxn: '25¢', cap: '$6', description: 'Per transaction $0 – $25,000' },
  large:     { rate: '0.05%', perTxn: null,  cap: null, description: 'On amount over $25,000 per transaction' },
}

export const FEE_SAVER_US = {
  merchantRate: '0%',
  customerRateInPerson: '3.0%',
  customerRateOnline: '3.0%',
  note: '3% in most cases — can vary by card type and international transactions.',
}

export const FEE_SAVER_CA = {
  merchantRate: '0%',
  customerRateInPerson: '2.4%',
  customerRateOnline: '3.0%',
  note: '3% in most cases — can vary by card type and international transactions.',
}

// Interchange + card brand fee constants (derived from Helcim partner pricing screenshots).
// These reflect a blended estimate at a typical card mix — true interchange is set by the
// card networks (Visa/Mastercard/Amex) and revised twice a year (April & October).
// Refresh against the official published schedules each cycle and bump INTERCHANGE_UPDATED.
//   Visa:       https://usa.visa.com/support/small-business/regulations-fees.html
//   Mastercard: https://www.mastercard.com/us/en/business/support/merchant-interchange-rates.html
// effective_rate = interchange_pct + gradient_markup_pct
export const INTERCHANGE_UPDATED = 'April 2026'

export const INTERCHANGE = {
  us: {
    inPerson: { visaMcDiscover: 1.39, amex: 2.19, pinDebit: 0.60 },
    keyed:    { visaMcDiscover: 1.81, amex: 2.49 },
  },
  ca: {
    inPerson: { visaMcDiscover: 1.32, amex: 1.78 },
    keyed:    { visaMcDiscover: 1.88, amex: 2.12 },
  },
}

export function detectTier(monthlyVolume: number): number {
  return US_TIERS.find(t => monthlyVolume >= t.volumeMin && monthlyVolume <= t.volumeMax)?.tier ?? 2
}

export const HELCIM_NOTES = [
  'All rates are Interchange+ (cost-plus). The interchange component is set by Visa/Mastercard/Amex and varies by card type.',
  'In-Person rates apply to chip/tap/swipe transactions. Keyed rates apply to manually entered or online transactions.',
  'Interac debit (Canada) is charged at a flat per-transaction fee — no percentage component.',
  'ACH (US) / EFT-PAD (Canada) rates are flat — no volume tiers apply.',
  'No monthly fees, PCI fees, statement fees, or cancellation fees.',
  'Tier is determined by the prior month\'s total processing volume and updates automatically each month.',
]
