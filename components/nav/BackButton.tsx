'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function BackButton() {
  const router = useRouter()
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => router.back()}>
      <ArrowLeft className="h-4 w-4" />
    </Button>
  )
}
