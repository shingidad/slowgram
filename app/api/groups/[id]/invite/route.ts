import { auth } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { inviteLinks, groupMembers } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()

  // Must be admin
  const [membership] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1)

  if (!membership || membership.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 })
  }

  try {
    // Delete old invite links, create new one
    await db.delete(inviteLinks).where(eq(inviteLinks.groupId, groupId))
    const token = randomBytes(16).toString('hex')
    await db.insert(inviteLinks).values({ groupId, token, createdBy: userId })
    console.log(JSON.stringify({ level: 'info', msg: 'invite_created', groupId }))
    return Response.json({ token })
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', msg: 'invite_failed', error: String(err) }))
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
