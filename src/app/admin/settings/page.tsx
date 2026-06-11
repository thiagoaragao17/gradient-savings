import { getSettings, getAdminUsers } from '@/lib/actions'
import SettingsForm from '@/components/SettingsForm'
import DangerZone from '@/components/DangerZone'
import UserManagement from '@/components/UserManagement'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [settings, users] = await Promise.all([getSettings(), getAdminUsers()])

  return (
    <div className="max-w-2xl space-y-6">
      <UserManagement users={users} />
      <SettingsForm settings={settings} />
      <DangerZone />
    </div>
  )
}
