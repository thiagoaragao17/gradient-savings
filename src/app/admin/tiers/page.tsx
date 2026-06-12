import { US_TIERS, CA_TIERS, ACH_RATES, FEE_SAVER_US, FEE_SAVER_CA, HELCIM_NOTES } from '@/lib/helcim-tiers'
import TiersClient from './TiersClient'

export default function TiersPage() {
  return (
    <TiersClient
      usTiers={US_TIERS}
      caTiers={CA_TIERS}
      achRates={ACH_RATES}
      feeSaverUS={FEE_SAVER_US}
      feeSaverCA={FEE_SAVER_CA}
      notes={HELCIM_NOTES}
    />
  )
}
