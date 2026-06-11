export interface InterchangeRow {
  card_type: string
  txns: number
  volume: number
  interchange_rate: string
  card_brand_fee: string
  gradient_fee: string
  cost: number
}

export interface CardNetworkData {
  rows: InterchangeRow[]
  total_txns: number
  total_volume: number
  total_cost: number
}

export interface InterchangeData {
  visa?: CardNetworkData
  mastercard?: CardNetworkData
  discover?: CardNetworkData
  amex?: CardNetworkData
  pin_debit?: CardNetworkData
}

export interface Prospect {
  id: string
  slug: string
  company_name: string
  company_address: string | null
  statement_date: string
  current_provider: string
  total_volume: number
  total_transactions: number
  processing_in_person_pct: number
  processing_keyed_pct: number
  card_consumer_pct: number
  card_premium_pct: number
  card_corporate_pct: number
  current_monthly_cost: number
  new_monthly_cost: number
  current_effective_rate: number
  new_effective_rate: number
  monthly_savings: number
  annual_savings: number
  helcim_tier: number
  helcim_comparison_number: number | null
  helcim_link: string | null
  signup_url: string | null
  interchange_data: InterchangeData
  expiry_date: string
  status: 'active' | 'expired' | 'inactive'
  lead_stage: 'new_lead' | 'in_conversation' | 'negotiating' | 'verbal_commit' | 'closed_won' | 'closed_lost' | 'on_hold'
  rep_name: string | null
  rep_email: string | null
  rep_phone: string | null
  created_at: string
  view_count: number
  first_viewed_at: string | null
  last_viewed_at: string | null
}
