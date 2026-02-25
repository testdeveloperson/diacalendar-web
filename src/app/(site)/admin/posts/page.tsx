'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, colorClass } from '@/lib/types'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

interface AdminPost {
  id: number
  title: string
  category: string
  created_at: string
  profiles: { nickname: string } | null
}

export default function AdminPostsPage() {
  const { categories, getCategoryColor } = useCategories()
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('id,title,category,created_at,profiles(nickname)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (categoryFilter) query = query.eq('category', categoryFilter)
    if (search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`)
    }

    const { data } = await query
    setPosts((data as unknown as AdminPost[]) ?? [])
    setLoading(false)
  }, [search, categoryFilter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleDelete = async (postId: number) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      toast.error('삭제 실패: ' + error.message)
    } else {
      toast.success('게시글이 삭제되었습니다')
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
    setConfirmDelete(null)
  }

  const handleCategoryChange = async (postId: number, newCategory: string) => {
    const { error } = await supabase.from('posts').update({ category: newCategory }).eq('id', postId)
    if (!error) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, category: newCategory } : p))
      toast.success('카테고리가 변경되었습니다')
    }
  }

  return (
    <div>
      <AlertDialog open={confirmDelete !== null} onOpenChange={(open) => { if (!open) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 게시글을 삭제하시겠습니까? 댓글도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete !== null && handleDelete(confirmDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 검색 + 필터 */}
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchPosts()}
          placeholder="제목 검색..."
          className="flex-1"
        />
        <Select value={categoryFilter || '__all__'} onValueChange={v => setCategoryFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">전체</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={fetchPosts}>
          <Search className="w-4 h-4 mr-1.5" />
          검색
        </Button>
      </div>

      {/* 게시글 목록 */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 text-xs font-semibold text-muted-foreground bg-muted/50 px-4 py-3 border-b">
          <span>제목</span>
          <span className="px-3">카테고리</span>
          <span className="px-3">작성자</span>
          <span className="px-3">날짜</span>
          <span className="px-3">삭제</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">게시글이 없습니다</div>
        ) : (
          <div className="divide-y">
            {posts.map(post => (
              <div key={post.id}>
                {/* Desktop */}
                <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-0 px-4 py-3 hover:bg-muted/30">
                  <Link href={`/board/${post.id}`} target="_blank" className="text-sm text-foreground hover:text-primary truncate pr-3">
                    {post.title}
                  </Link>
                  <div className="px-3">
                    <select
                      value={post.category}
                      onChange={e => handleCategoryChange(post.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-semibold border-0 cursor-pointer focus:outline-none ${colorClass(getCategoryColor(post.category))}`}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <span className="px-3 text-xs text-muted-foreground whitespace-nowrap">{post.profiles?.nickname ?? '알 수 없음'}</span>
                  <span className="px-3 text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(post.created_at)}</span>
                  <div className="px-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(post.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden px-4 py-3 hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Link href={`/board/${post.id}`} target="_blank" className="text-sm font-medium text-foreground hover:text-primary leading-snug flex-1">
                      {post.title}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(post.id)}
                      className="flex-shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={post.category}
                      onChange={e => handleCategoryChange(post.id, e.target.value)}
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold border-0 cursor-pointer focus:outline-none ${colorClass(getCategoryColor(post.category))}`}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground">{post.profiles?.nickname ?? '알 수 없음'}</span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-right">최대 100개 표시 · 카테고리는 셀렉트박스에서 바로 변경 가능</p>
    </div>
  )
}
