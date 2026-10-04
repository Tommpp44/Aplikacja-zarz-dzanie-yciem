import { CommandPalette } from '@/components/search/command-palette'
import { KeyboardShortcuts } from '@/components/layout/keyboard-shortcuts'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { ThemeSync } from '@/components/layout/theme-sync'
import { Topbar } from '@/components/layout/topbar'
import { QuickCapture } from '@/components/quick-capture/quick-capture'
import { getOnboardedUserContext } from '@/lib/settings/service'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, user, prefs } = await getOnboardedUserContext()
  const name = profile.display_name || user.email?.split('@')[0] || 'there'
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <ThemeSync theme={prefs.theme as 'light' | 'dark' | 'system'} accent={prefs.accent} />
      <Sidebar />
      <div className="lg:pl-60">
        <Topbar name={name} email={user.email} accent={prefs.accent} />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>
      <MobileNav />
      <QuickCapture />
      <CommandPalette />
      <KeyboardShortcuts />
    </div>
  )
}
