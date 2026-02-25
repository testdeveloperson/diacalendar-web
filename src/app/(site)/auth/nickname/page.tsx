'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, User } from 'lucide-react'

export default function NicknamePage() {
  const { user, anonId, nickname: existingNickname, isLoading, setNicknameForUser } = useAuth()
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDuplicate, setIsDuplicate] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login')
    }
    if (!isLoading && user && existingNickname) {
      router.replace('/board')
    }
  }, [isLoading, user, existingNickname, router])

  const checkDuplicate = useCallback(async (value: string) => {
    if (!anonId || !/^[가-힣]{1,5}$/.test(value.trim())) {
      setIsDuplicate(null)
      return
    }

    setChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', value.trim())
      .neq('id', anonId)
      .limit(1)

    setIsDuplicate(data !== null && data.length > 0)
    setChecking(false)
  }, [anonId])

  useEffect(() => {
    if (!/^[가-힣]{1,5}$/.test(nickname.trim())) {
      setIsDuplicate(null)
      return
    }

    const timer = setTimeout(() => {
      checkDuplicate(nickname)
    }, 500)

    return () => clearTimeout(timer)
  }, [nickname, checkDuplicate])

  const isValidNickname = (value: string) => /^[가-힣]{1,5}$/.test(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = nickname.trim()
    if (!isValidNickname(trimmed)) {
      setError('닉네임은 한글 1~5자로 입력해주세요')
      return
    }

    if (isDuplicate) {
      setError('이미 사용 중인 닉네임입니다')
      return
    }

    setSubmitting(true)
    const { error } = await setNicknameForUser(trimmed)
    if (error) {
      setError(error)
      setSubmitting(false)
    } else {
      router.replace('/board')
    }
  }

  if (isLoading || (!user && !isLoading)) {
    return (
      <div className="flex items-center justify-center mt-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20">
      <Card>
        <CardHeader className="text-center">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm">
            <User className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl">닉네임 설정</CardTitle>
          <CardDescription>커뮤니티에서 사용할 닉네임을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
                maxLength={5}
                placeholder="한글 1~5자"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">한글만 사용 가능, 최대 5자</p>
              {/^[가-힣]{1,5}$/.test(nickname.trim()) && (
                <p className={`text-xs ${checking ? 'text-muted-foreground' : isDuplicate ? 'text-destructive' : 'text-green-500'}`}>
                  {checking ? '확인 중...' : isDuplicate ? '이미 사용 중인 닉네임입니다' : '사용 가능한 닉네임입니다'}
                </p>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || checking || isDuplicate === true || !/^[가-힣]{1,5}$/.test(nickname.trim())}
              className="w-full"
              size="lg"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitting ? '설정 중...' : '닉네임 설정'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
