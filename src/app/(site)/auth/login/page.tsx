'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { signInWithOAuth } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  const handleOAuth = async (provider: 'google' | 'kakao' | 'apple') => {
    setLoading(provider)
    await signInWithOAuth(provider)
  }

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20">
      <Card>
        <CardHeader className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>소셜 계정으로 간편하게 시작하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium"
            onClick={() => handleOAuth('google')}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Google로 계속하기
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium"
            onClick={() => handleOAuth('kakao')}
            disabled={loading !== null}
          >
            {loading === 'kakao' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.63 1.76 4.95 4.4 6.27-.19.71-.7 2.56-.8 2.96-.13.49.18.49.37.36.15-.1 2.41-1.64 3.38-2.31.87.13 1.77.2 2.65.2 5.52 0 10-3.36 10-7.48S17.52 3 12 3z" fill="#3C1E1E" />
              </svg>
            )}
            카카오로 계속하기
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium"
            onClick={() => handleOAuth('apple')}
            disabled={loading !== null}
          >
            {loading === 'apple' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.13 4.39-3.74 4.25z" />
              </svg>
            )}
            Apple로 계속하기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
