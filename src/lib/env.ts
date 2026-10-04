import { z } from 'zod'

/**
 * Public configuration (safe to ship to the browser). `NEXT_PUBLIC_*` values
 * must be referenced literally so Next.js can inline them at build time.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_OAUTH_PROVIDERS: z.string().optional().default(''),
})

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_OAUTH_PROVIDERS: process.env.NEXT_PUBLIC_OAUTH_PROVIDERS,
})

export const OAUTH_PROVIDERS = ['google', 'github', 'apple', 'azure'] as const
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

export function enabledOAuthProviders(): OAuthProvider[] {
  return publicEnv.NEXT_PUBLIC_OAUTH_PROVIDERS.split(',')
    .map((p) => p.trim())
    .filter((p): p is OAuthProvider => (OAUTH_PROVIDERS as readonly string[]).includes(p))
}
