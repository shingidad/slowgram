import BackButton from '@/components/nav/BackButton'
import CreateGroupForm from '@/components/groups/CreateGroupForm'

export default function NewGroupPage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton />
        <h1 className="text-base font-medium">새 그룹 만들기</h1>
      </header>
      <CreateGroupForm />
    </div>
  )
}
