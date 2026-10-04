import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'

export default async function NotFound() {
  const t = await getT()
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-primary text-sm font-medium">404</p>
      <h1 className="text-xl font-semibold">{t("This page doesn't exist")}</h1>
      <p className="text-muted-foreground text-sm">{t('It may have been moved or deleted.')}</p>
      <Button asChild>
        <Link href="/dashboard">{t('Go to dashboard')}</Link>
      </Button>
    </main>
  )
}
