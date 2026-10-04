'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { I18nProvider } from '@/lib/i18n/client'
import type { Locale } from '@/lib/i18n/config'
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker'

export function Providers({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster />
          <ServiceWorkerRegistration />
        </TooltipProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}
