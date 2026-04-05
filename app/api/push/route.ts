import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { pushSubscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { endpoint, p256dh, auth: authKey } = await req.json()
    if (!endpoint || !p256dh || !authKey) {
      return Response.json({ error: 'Missing subscription fields' }, { status: 400 })
    }

    const db = getDb()
    await db
      .insert(pushSubscriptions)
      .values({ userId, endpoint, p256dh, auth: authKey })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { p256dh, auth: authKey, userId },
      })

    console.log(JSON.stringify({ level: 'info', msg: 'push_subscribed', userId }))
    return Response.json({ ok: true })
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'push_subscribe_failed', error: String(err) }))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { endpoint } = await req.json()
    if (!endpoint) return Response.json({ error: 'Missing endpoint' }, { status: 400 })

    const db = getDb()
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)))

    return Response.json({ ok: true })
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'push_unsubscribe_failed', error: String(err) }))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
