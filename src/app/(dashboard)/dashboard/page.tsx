import { getOnboardedUserContext } from '@/lib/settings/service'
export default async function DashboardPage() {
  const { profile } = await getOnboardedUserContext()
  return <h1 className="text-2xl font-semibold">Hello {profile.display_name}</h1>
}
