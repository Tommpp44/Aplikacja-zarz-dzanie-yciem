import { SettingsNav } from '@/components/settings/settings-nav'
import { PageHeader } from '@/components/ui/page-header'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" description="Make LifeOS yours. Your data, your rules." />
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </>
  )
}
