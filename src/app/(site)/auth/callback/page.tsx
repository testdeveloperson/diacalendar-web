'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { computeAnonId } from '@/lib/anonId'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user?.email) {
        const anonId = await computeAnonId(session.user.email)

        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, terms_agreed_at')
          .eq('id', anonId)
          .maybeSingle()

        if (!profile?.terms_agreed_at) {
          router.replace('/auth/terms')
          return
        }

        if (!profile?.nickname) {
          router.replace('/auth/nickname')
          return
        }

        router.replace('/board')
      } else {
        router.replace('/auth/login')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center mt-20">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
