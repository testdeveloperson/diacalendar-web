'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', session.user.id)
            .single()

          if (!profile?.nickname) {
            router.replace('/auth/nickname')
            return
          }
        }
      }

      router.replace('/board')
    }

    handleCallback()
  }, [router])

  return (
    <div className="max-w-sm mx-auto mt-16 text-center">
      <p className="text-gray-600">인증 처리 중...</p>
    </div>
  )
}
