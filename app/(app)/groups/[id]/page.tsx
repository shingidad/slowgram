import { notFound } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { familyGroups, groupMembers, inviteLinks, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import BackButton from '@/components/nav/BackButton'
import InviteLinkSection from '@/components/groups/InviteLinkSection'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params
  const user = await currentUser()
  const db = getDb()

  const [group] = await db
    .select()
    .from(familyGroups)
    .where(eq(familyGroups.id, id))
    .limit(1)

  if (!group) notFound()

  const members = await db
    .select({ member: groupMembers, user: users })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, id))

  const myMembership = members.find(m => m.member.userId === user!.id)
  if (!myMembership) notFound()

  const isAdmin = myMembership.member.role === 'admin'

  // Get or create invite link for admins
  let inviteToken: string | null = null
  if (isAdmin) {
    const [existingLink] = await db
      .select()
      .from(inviteLinks)
      .where(eq(inviteLinks.groupId, id))
      .limit(1)

    if (existingLink) {
      inviteToken = existingLink.token
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton />
        <h1 className="text-base font-medium truncate">{group.name}</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Group info */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-medium tracking-tight">{group.name}</h2>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>

        <Separator />

        {/* Members */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            구성원 {members.length}명
          </h3>
          <div className="space-y-3">
            {members.map(({ member, user: memberUser }) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={memberUser.imageUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{memberUser.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{memberUser.name}</span>
                    {member.userId === user!.id && (
                      <span className="text-xs text-muted-foreground">(나)</span>
                    )}
                  </div>
                </div>
                {member.role === 'admin' && (
                  <Badge variant="secondary" className="text-[10px]">관리자</Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invite link (admin only) */}
        {isAdmin && (
          <>
            <Separator />
            <InviteLinkSection groupId={id} initialToken={inviteToken} />
          </>
        )}
      </div>
    </div>
  )
}
