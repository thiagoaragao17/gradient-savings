export interface HelcimTier {
  tier: number
  volumeRange: string
  volumeMin: number   // monthly $, 0 = no minimum
  volumeMax: number   // monthly $, Infinity = no cap
  inPerson: string    // interchange+ rate string
  keyed: string       // interchange+ rate string
}

export const HELCIM_TIERS: HelcimTier[] = [
  { tier: 1, volumeRange: '$0 – $50k',     volumeMin: 0,       volumeMax: 49999,    inPerson: '0.40% + 8¢',  keyed: '0.50% + 25¢' },
  { tier: 2, volumeRange: '$50k – $100k',  volumeMin: 50000,   volumeMax: 99999,    inPerson: '0.35% + 7¢',  keyed: '0.45% + 20¢' },
  { tier: 3, volumeRange: '$100k – $500k', volumeMin: 100000,  volumeMax: 499999,   inPerson: '0.25% + 7¢',  keyed: '0.35% + 20¢' },
  { tier: 4, volumeRange: '$500k – $1M',   volumeMin: 500000,  volumeMax: 999999,   inPerson: '0.20% + 6¢',  keyed: '0.25% + 15¢' },
  { tier: 5, volumeRange: '$1M – $5M',      volumeMin: 1000000, volumeMax: 4999999,  inPerson: '0.15% + 6¢',  keyed: '0.15% + 15¢' },
  { tier: 6, volumeRange: '$5M+',           volumeMin: 5000000, volumeMax: Infinity, inPerson: 'Custom',       keyed: 'Custom'       },
]

export function detectTier(monthlyVolume: number): number {
  return HELCIM_TIERS.find(t => monthlyVolume >= t.volumeMin && monthlyVolume <= t.volumeMax)?.tier ?? 2
}

export const ACH_RATES = {
  standard: { rate: '0.5%', perTxn: '25¢', cap: '$6', description: 'Per transaction between $0 – $25,000' },
  large:     { rate: '0.05%', perTxn: null,  cap: null, description: 'On amount over $25,000 per transaction' },
}

export const FEE_SAVER = {
  merchantRate: '0%',
  customerRateInPerson: '3.0%',
  customerRateOnline: '3.0%',
  note: '3% in most cases — can vary by card type and international transactions.',
}

export const HELCIM_NOTES = [
  'All rates are Interchange+ (cost-plus). The interchange component is set by Visa/Mastercard/Amex and varies by card type.',
  'In-Person rates apply to chip/tap/swipe transactions. Keyed rates apply to manually entered or online transactions.',
  'Debit transactions are processed at a flat rate — typically lower than credit interchange.',
  'No monthly fees, PCI fees, statement fees, or cancellation fees.',
  'Tier is determined by the prior month\'s total processing volume and updates automatically each month.',
]
