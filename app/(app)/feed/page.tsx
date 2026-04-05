import { Suspense } from 'react'
import { currentUser } from '@clerk/nextjs/server'
import FeedList from '@/components/feed/FeedList'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export default async function FeedPage() {
  const user = await currentUser()

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium tracking-[-0.03em] text-foreground">슬로우그램</h1>
          <Link href="/post/new">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <Suspense fallback={<FeedSkeleton />}>
        <FeedList userId={user!.id} />
      </Suspense>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
