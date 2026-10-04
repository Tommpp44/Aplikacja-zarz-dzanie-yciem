import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { Providers } from '@/components/layout/providers'
import { ACCENTS, ACCENT_COOKIE } from '@/lib/settings/schemas'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'LifeOS', template: '%s · LifeOS' },
  description:
    'Your personal operating system — tasks, goals, habits, money and training in one calm place.',
  applicationName: 'LifeOS',
  appleWebApp: { capable: true, title: 'LifeOS', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  icons: { apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafb' },
    { media: '(prefers-color-scheme: dark)', color: '#131418' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const accentCookie = (await cookies()).get(ACCENT_COOKIE)?.value
  const accent = (ACCENTS as readonly string[]).includes(accentCookie ?? '')
    ? accentCookie
    : 'indigo'
  return (
    <html
      lang="en"
      data-accent={accent}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
