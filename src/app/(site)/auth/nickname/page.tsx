'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function NicknamePage() {
  const { user, nickname: existingNickname, isLoading, setNicknameForUser } = useAuth()
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
    if (!user || value.trim().length < 2) {
      setIsDuplicate(null)
      return
    }

    setChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', value.trim())
      .neq('id', user.id)
      .limit(1)

    setIsDuplicate(data !== null && data.length > 0)
    setChecking(false)
  }, [user])

  useEffect(() => {
    if (nickname.trim().length < 2) {
      setIsDuplicate(null)
      return
    }

    const timer = setTimeout(() => {
      checkDuplicate(nickname)
    }, 500)

    return () => clearTimeout(timer)
  }, [nickname, checkDuplicate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = nickname.trim()
    if (trimmed.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다')
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
      <div className="max-w-sm mx-auto mt-16 text-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20">
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">닉네임 설정</h1>
          <p className="text-sm text-gray-400 mt-1">커뮤니티에서 사용할 닉네임을 설정하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm placeholder-gray-400"
              placeholder="2자 이상"
            />
            {nickname.trim().length >= 2 && (
              <p className={`mt-1.5 text-xs ${checking ? 'text-gray-400' : isDuplicate ? 'text-red-500' : 'text-green-500'}`}>
                {checking ? '확인 중...' : isDuplicate ? '이미 사용 중인 닉네임입니다' : '사용 가능한 닉네임입니다'}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || checking || isDuplicate === true || nickname.trim().length < 2}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {submitting ? '설정 중...' : '닉네임 설정'}
          </button>
        </form>
      </div>
    </div>
  )
}
