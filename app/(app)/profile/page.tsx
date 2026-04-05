import { currentUser } from '@clerk/nextjs/server'
import { UserProfile } from '@clerk/nextjs'
import BackButton from '@/components/nav/BackButton'

export default async function ProfilePage() {
  const user = await currentUser()

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="text-base font-medium">내 정보</h1>
      </header>
      <div className="p-4 flex justify-center">
        <UserProfile />
      </div>
    </div>
  )
}
