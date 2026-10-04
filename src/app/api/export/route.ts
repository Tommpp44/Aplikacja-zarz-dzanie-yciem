import { NextResponse } from 'next/server'
import { exportUserData } from '@/lib/account/export'
import { getSession } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

/** GET /api/export — full JSON export of the signed-in user's data (GDPR). */
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const payload = await exportUserData(session.supabase, session.user.id)
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="lifeos-export-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    logger.error('export failed', { route: 'export', userId: session.user.id }, error)
    return NextResponse.json(
      { error: "We couldn't prepare your export. Please try again." },
      { status: 500 },
    )
  }
}
