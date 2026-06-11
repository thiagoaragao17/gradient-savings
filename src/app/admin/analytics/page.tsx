import { getProspects } from '@/lib/actions'
import AdminDashboard from '@/components/AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const prospects = await getProspects()
  return <AdminDashboard prospects={prospects} />
}
