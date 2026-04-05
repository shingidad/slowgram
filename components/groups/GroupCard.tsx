import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { FamilyGroup } from '@/lib/db/schema'

interface GroupCardProps {
  group: FamilyGroup
  role: 'admin' | 'member'
}

export default function GroupCard({ group, role }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 p-4">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-accent flex-shrink-0 flex items-center justify-center">
              {group.coverImageUrl ? (
                <Image
                  src={group.coverImageUrl}
                  alt={group.name}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Users className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-foreground truncate">{group.name}</h3>
                {role === 'admin' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">관리자</Badge>
                )}
              </div>
              {group.description && (
                <p className="text-xs text-muted-foreground truncate">{group.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
