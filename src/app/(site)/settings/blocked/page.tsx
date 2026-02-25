'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { BlockedUser, formatRelativeTime } from '@/lib/types'

export default function BlockedUsersPage() {
  const { user, anonId } = useAuth()
  const router = useRouter()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!anonId) return
    const fetch = async () => {
      const { data } = await supabase
        .from('blocks')
        .select('id,blocker_id,blocked_id,created_at,profiles:blocked_id(nickname)')
        .eq('blocker_id', anonId)
        .order('created_at', { ascending: false })

      if (data) setBlockedUsers(data as unknown as BlockedUser[])
      setLoading(false)
    }
    fetch()
  }, [anonId])

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleUnblock = async (blockedId: string) => {
    await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', anonId!)
      .eq('blocked_id', blockedId)

    setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">차단 관리</h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">차단한 사용자가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockedUsers.map(blocked => (
            <div
              key={blocked.id}
              className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                  {(blocked.profiles?.nickname ?? '?')[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {blocked.profiles?.nickname ?? '알 수 없음'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(blocked.created_at)} 차단
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnblock(blocked.blocked_id)}
                className="text-sm text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                차단 해제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
