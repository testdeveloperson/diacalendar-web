'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { BlockedUser, formatRelativeTime } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Ban } from 'lucide-react'

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
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Ban className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">차단한 사용자가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockedUsers.map(blocked => (
            <div
              key={blocked.id}
              className="bg-card rounded-xl border p-4 sm:p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm font-bold">
                    {(blocked.profiles?.nickname ?? '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">
                    {blocked.profiles?.nickname ?? '알 수 없음'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(blocked.created_at)} 차단
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnblock(blocked.blocked_id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                차단 해제
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
