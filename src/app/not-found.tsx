import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-primary text-sm font-medium">404</p>
      <h1 className="text-xl font-semibold">This page doesn&apos;t exist</h1>
      <p className="text-muted-foreground text-sm">It may have been moved or deleted.</p>
      <Button asChild>
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </main>
  )
}
