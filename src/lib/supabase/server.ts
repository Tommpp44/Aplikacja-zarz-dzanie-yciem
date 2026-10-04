import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publicEnv } from '@/lib/env'
import type { Database } from '@/lib/db/types'

/**
 * Supabase client bound to the current request's session. All queries run as the
 * signed-in user, so Row Level Security applies.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component: the proxy refreshes sessions instead.
          }
        },
      },
    },
  )
}
