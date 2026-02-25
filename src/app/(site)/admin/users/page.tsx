'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Trash2, Search } from 'lucide-react'

interface AdminUser {
  id: string
  nickname: string
  is_admin: boolean
  updated_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('id,nickname,is_admin,updated_at')
      .order('updated_at', { ascending: false })
      .limit(200)

    if (search.trim()) {
      query = query.ilike('nickname', `%${search.trim()}%`)
    }

    const { data } = await query
    setUsers((data as AdminUser[]) ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (user: AdminUser) => {
    if (user.is_admin) {
      toast.error('관리자 계정은 삭제할 수 없습니다')
      setConfirmDelete(null)
      return
    }
    const { error } = await supabase.from('profiles').delete().eq('id', user.id)
    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      toast.success(`${user.nickname} 계정이 삭제되었습니다`)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    }
    setConfirmDelete(null)
  }

  const handleToggleAdmin = async (user: AdminUser) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !user.is_admin })
      .eq('id', user.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u))
      toast.success(user.is_admin ? '관리자 권한이 해제되었습니다' : '관리자 권한이 부여되었습니다')
    }
  }

  return (
    <div>
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDelete?.nickname} 계정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              해당 사용자의 모든 게시글과 댓글이 함께 삭제됩니다. Supabase Auth 계정은 대시보드에서 별도 삭제가 필요합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 검색 */}
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchUsers()}
          placeholder="닉네임 검색..."
          className="flex-1"
        />
        <Button onClick={fetchUsers}>
          <Search className="w-4 h-4 mr-1.5" />
          검색
        </Button>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] gap-0 text-xs font-semibold text-muted-foreground bg-muted/50 px-4 py-3 border-b">
          <span className="pr-3">아바타</span>
          <span>닉네임</span>
          <span className="px-4">관리자</span>
          <span className="px-3">삭제</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">사용자가 없습니다</div>
        ) : (
          <div className="divide-y">
            {users.map(user => (
              <div key={user.id}>
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 px-4 py-3 hover:bg-muted/30">
                  <div className="pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {user.nickname[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{user.nickname}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{user.id.slice(0, 8)}...</p>
                  </div>
                  <div className="px-4">
                    <Badge
                      variant={user.is_admin ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleToggleAdmin(user)}
                    >
                      {user.is_admin ? '관리자' : '일반'}
                    </Badge>
                  </div>
                  <div className="px-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(user)}
                      disabled={user.is_admin}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden px-4 py-3 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {user.nickname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{user.nickname}</p>
                        <Badge
                          variant={user.is_admin ? 'default' : 'secondary'}
                          className="cursor-pointer text-xs"
                          onClick={() => handleToggleAdmin(user)}
                        >
                          {user.is_admin ? '관리자' : '일반'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">{user.id.slice(0, 8)}...</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(user)}
                      disabled={user.is_admin}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-right">최대 200명 표시 · 관리자 뱃지 클릭으로 권한 토글 가능</p>
    </div>
  )
}
