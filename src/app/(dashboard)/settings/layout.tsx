import { SettingsNav } from '@/components/settings/settings-nav'
import { PageHeader } from '@/components/ui/page-header'
import { getT } from '@/lib/i18n/server'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const t = await getT()
  return (
    <>
      <PageHeader
        title={t('Settings')}
        description={t('Make LifeOS yours. Your data, your rules.')}
      />
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  )
}
