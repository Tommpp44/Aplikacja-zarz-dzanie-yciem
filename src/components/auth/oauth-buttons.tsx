'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { signInWithOAuth } from '@/lib/auth/actions'
import type { OAuthProvider } from '@/lib/env'

const LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  apple: 'Apple',
  azure: 'Microsoft',
}

export function OAuthButtons({ providers, next }: { providers: OAuthProvider[]; next?: string }) {
  const [pending, startTransition] = useTransition()
  if (providers.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground my-2 flex items-center gap-3 text-xs">
        <span className="bg-border h-px flex-1" />
        or continue with
        <span className="bg-border h-px flex-1" />
      </div>
      {providers.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await signInWithOAuth(provider, next)
              if (result && !result.ok) toast.error(result.error)
            })
          }
        >
          {LABELS[provider]}
        </Button>
      ))}
    </div>
  )
}
