import { currentUser } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db'
import { groupMembers, familyGroups } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'
import GroupCard from '@/components/groups/GroupCard'

export default async function GroupsPage() {
  const user = await currentUser()
  const db = getDb()

  const memberships = await db
    .select({ group: familyGroups, role: groupMembers.role })
    .from(groupMembers)
    .innerJoin(familyGroups, eq(groupMembers.groupId, familyGroups.id))
    .where(eq(groupMembers.userId, user!.id))

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-medium">가족 그룹</h1>
        <Link href="/groups/new">
          <Button size="sm" className="h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            만들기
          </Button>
        </Link>
      </header>

      <div className="p-4 space-y-3">
        {memberships.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-base font-medium mb-2">가족 그룹이 없어요</h2>
            <p className="text-sm text-muted-foreground mb-6">
              그룹을 만들고 가족을 초대해보세요
            </p>
            <Link href="/groups/new">
              <Button>그룹 만들기</Button>
            </Link>
          </div>
        ) : (
          memberships.map(({ group, role }) => (
            <GroupCard key={group.id} group={group} role={role} />
          ))
        )}
      </div>
    </div>
  )
}
