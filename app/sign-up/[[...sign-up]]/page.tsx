import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium tracking-[-0.03em] text-foreground">슬로우그램</h1>
          <p className="text-sm text-muted-foreground mt-2">가족과 함께 시작해요</p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
