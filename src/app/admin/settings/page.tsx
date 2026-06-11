import { getSettings } from '@/lib/actions'
import SettingsForm from '@/components/SettingsForm'
import DangerZone from '@/components/DangerZone'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsForm settings={settings} />
      <DangerZone />
    </div>
  )
}
