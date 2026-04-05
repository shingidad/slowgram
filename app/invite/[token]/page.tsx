import { redirect, notFound } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { inviteLinks, groupMembers, familyGroups, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const user = await currentUser()

  if (!user) {
    redirect(`/sign-in?redirect_url=/invite/${token}`)
  }

  const db = getDb()
  const [invite] = await db
    .select({ invite: inviteLinks, group: familyGroups })
    .from(inviteLinks)
    .innerJoin(familyGroups, eq(inviteLinks.groupId, familyGroups.id))
    .where(eq(inviteLinks.token, token))
    .limit(1)

  if (!invite) notFound()

  // Check if already a member
  const [existing] = await db
    .select()
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, invite.invite.groupId), eq(groupMembers.userId, user.id)))
    .limit(1)

  if (!existing) {
    // Upsert user then join
    await db.insert(users).values({
      id: user.id,
      name: user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.username ?? '사용자',
      imageUrl: user.imageUrl,
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.username ?? '사용자',
        imageUrl: user.imageUrl,
      },
    })

    await db.insert(groupMembers).values({
      groupId: invite.invite.groupId,
      userId: user.id,
      role: 'member',
    })
  }

  redirect(`/groups/${invite.invite.groupId}`)
}
