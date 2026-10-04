import 'server-only'
import { z } from 'zod'

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(8).optional(),
  AI_PROVIDER: z.enum(['rules']).default('rules'),
})

/** Server-only secrets. Never import this module from client components. */
export const serverEnv = serverSchema.parse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  CRON_SECRET: process.env.CRON_SECRET || undefined,
  AI_PROVIDER: process.env.AI_PROVIDER || undefined,
})
