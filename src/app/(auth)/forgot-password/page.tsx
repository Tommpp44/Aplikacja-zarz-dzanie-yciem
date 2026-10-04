import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/password-forms'

export const metadata: Metadata = { title: 'Reset password' }

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-4">
      <ForgotPasswordForm />
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground text-center text-sm"
      >
        Back to sign in
      </Link>
    </div>
  )
}
