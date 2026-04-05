import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/nav/BottomNav'
import PushNotificationManager from '@/components/PushNotificationManager'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="sm:bg-muted/30 min-h-screen">
      <div className="flex flex-col min-h-screen max-w-lg mx-auto sm:border-x sm:border-border sm:shadow-sm bg-background">
        <main className="flex-1 pb-20">
          {children}
        </main>
        <BottomNav />
        <PushNotificationManager />
      </div>
    </div>
  )
}
