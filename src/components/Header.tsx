'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, Ban, Shield, LogOut, UserMinus, ChevronDown, MessageCircle } from 'lucide-react'

const LAST_VISITED_KEY = 'board_last_visited_at'

export default function Header() {
  const { user, nickname, signOut, isAdmin } = useAuth()
  const [hasNewPosts, setHasNewPosts] = useState(false)

  useEffect(() => {
    const lastVisited = localStorage.getItem(LAST_VISITED_KEY)
    if (!lastVisited) return

    supabase
      .from('posts')
      .select('id')
      .gt('created_at', lastVisited)
      .limit(1)
      .then(({ data }) => {
        setHasNewPosts(!!data && data.length > 0)
      })
  }, [])

  return (
    <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/board" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            {hasNewPosts && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
            )}
          </div>
          <span className="text-lg font-bold group-hover:text-blue-600 transition-colors">
            커뮤니티
          </span>
        </Link>

        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-full px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">
                      {(nickname ?? '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">{nickname ?? '사용자'}</span>
                  <ChevronDown className="hidden sm:block h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <p className="font-semibold">{nickname ?? '사용자'}</p>
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/board/my" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    내 글 목록
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/blocked" className="flex items-center gap-2 cursor-pointer">
                    <Ban className="h-4 w-4" />
                    차단 관리
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2 cursor-pointer text-blue-600">
                      <Shield className="h-4 w-4" />
                      관리자 패널
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/withdraw" className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                    <UserMinus className="h-4 w-4" />
                    회원 탈퇴
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
