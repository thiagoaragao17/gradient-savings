import { createClient } from '@supabase/supabase-js'

const db = createClient(
  'https://vshybpothduvluluguxv.supabase.co',
  'process.env.SUPABASE_SERVICE_ROLE_KEY',
  { auth: { persistSession: false } }
)

const prospect = {
  slug: 'decision-digital',
  company_name: 'Decision Digital Inc',
  company_address: '6105 Blue Stone Rd Ste F, Atlanta, GA 30328-5903',
  statement_date: 'April 2026',
  current_provider: 'Global Payments',
  total_volume: 77446.31,
  total_transactions: 54,
  processing_in_person_pct: 0,
  processing_keyed_pct: 100,
  card_consumer_pct: 40,
  card_premium_pct: 10,
  card_corporate_pct: 50,
  current_monthly_cost: 2767.83,
  new_monthly_cost: 1857.16,
  current_effective_rate: 3.57,
  new_effective_rate: 2.40,
  monthly_savings: 910.67,
  annual_savings: 10928.04,
  helcim_tier: 2,
  helcim_link: 'https://pricing.helcim.com/comparison/f9668c31-faa0-4515-92f8-963b71ac4390',
  signup_url: null,
  expiry_date: '2026-08-30',
  status: 'active',
  interchange_data: {
    visa: {
      total_txns: 22,
      total_volume: 26221.06,
      total_cost: 516.43,
      rows: [
        { card_type: 'VI Credit CPS Keyed',                  txns: 5, volume: 5959.33,  interchange_rate: '1.80% + 10¢', card_brand_fee: '0.22% + 3¢', gradient_fee: '0.45% + 20¢', cost: 148.98 },
        { card_type: 'VI Credit Rewards Traditional Keyed',  txns: 1, volume: 1191.87,  interchange_rate: '1.89% + 10¢', card_brand_fee: '0.22% + 3¢', gradient_fee: '0.45% + 20¢', cost: 30.87  },
        { card_type: 'VI Credit Corporate Level 2 Keyed',    txns: 3, volume: 3575.60,  interchange_rate: '2.50% + 10¢', card_brand_fee: '0.22% + 3¢', gradient_fee: '0.45% + 20¢', cost: 114.42 },
        { card_type: 'VI Debit CPS Keyed',                   txns: 1, volume: 1191.87,  interchange_rate: '1.65% + 10¢', card_brand_fee: '0.22% + 3¢', gradient_fee: '0.45% + 20¢', cost: 28.01  },
        { card_type: 'VI Debit CPS Regulated Keyed',         txns: 3, volume: 3575.60,  interchange_rate: '0.05% + 22¢', card_brand_fee: '0.22% + 3¢', gradient_fee: '0.45% + 20¢', cost: 27.17  },
        { card_type: 'VI Debit Business Keyed',              txns: 3, volume: 3575.60,  interchange_rate: '2.45% + 10¢', card_brand_fee: '0.22% + 3¢', gradient_fee: '0.45% + 20¢', cost: 112.63 },
        { card_type: 'VI Debit Business Regulated Keyed',    txns: 6, volume: 7151.19,  interchange_rate: '0.05% + 22¢', card_brand_fee: '0.22% + 3¢', gradient_fee: '0.45% + 20¢', cost: 54.35  },
      ],
    },
    mastercard: {
      total_txns: 11,
      total_volume: 12738.00,
      total_cost: 216.90,
      rows: [
        { card_type: 'MC Credit Consumer Keyed',           txns: 3, volume: 3474.00, interchange_rate: '1.95% + 10¢', card_brand_fee: '0.19% + 3¢', gradient_fee: '0.45% + 20¢', cost: 91.02 },
        { card_type: 'MC Credit Corporate Level 2 Keyed',  txns: 1, volume: 1158.00, interchange_rate: '2.50% + 10¢', card_brand_fee: '0.19% + 3¢', gradient_fee: '0.45% + 20¢', cost: 36.71 },
        { card_type: 'MC Debit Regulated Keyed',           txns: 2, volume: 2316.00, interchange_rate: '0.05% + 22¢', card_brand_fee: '0.19% + 3¢', gradient_fee: '0.45% + 20¢', cost: 16.91 },
        { card_type: 'MC Debit Business Keyed',            txns: 1, volume: 1158.00, interchange_rate: '2.65% + 10¢', card_brand_fee: '0.19% + 3¢', gradient_fee: '0.45% + 20¢', cost: 38.45 },
        { card_type: 'MC Debit Business Regulated Keyed',  txns: 4, volume: 4632.00, interchange_rate: '0.05% + 22¢', card_brand_fee: '0.19% + 3¢', gradient_fee: '0.45% + 20¢', cost: 33.81 },
      ],
    },
    amex: {
      total_txns: 21,
      total_volume: 38487.27,
      total_cost: 1123.83,
      rows: [
        { card_type: 'AX Opt-Blue General < $3,000 Keyed', txns: 21, volume: 38487.27, interchange_rate: '1.95% + 10¢', card_brand_fee: '0.50% + 3¢', gradient_fee: '0.45% + 20¢', cost: 1123.83 },
      ],
    },
  },
}

const { error } = await db.from('prospects').insert(prospect)

if (error) {
  console.error('Error:', error.message)
} else {
  console.log('Seeded: Decision Digital Inc')
  console.log('Prospect URL: http://localhost:3000/p/decision-digital')
}
