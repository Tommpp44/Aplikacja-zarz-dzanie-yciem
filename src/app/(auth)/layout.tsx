import Link from 'next/link'
import { Logo } from '@/components/layout/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/login" className="mb-8" aria-label="LifeOS home">
        <Logo className="text-lg" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-muted-foreground mt-10 max-w-sm text-center text-xs">
        Your data is private to your account and protected by row-level security.
      </p>
    </main>
  )
}
