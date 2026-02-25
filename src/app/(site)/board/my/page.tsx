'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Post, getCommentCount, formatRelativeTime, colorClass } from '@/lib/types'
import { useCategories } from '@/hooks/useCategories'
import { Button } from '@/components/ui/button'
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
import { Loader2, FileText, MessageCircle } from 'lucide-react'

export default function MyPostsPage() {
  const { user, anonId } = useAuth()
  const { getCategoryLabel, getCategoryColor } = useCategories()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  useEffect(() => {
    if (!anonId) return
    const fetch = async () => {
      const { data } = await supabase
        .from('posts')
        .select('id,author_id,title,content,category,created_at,profiles(nickname),comments(count)')
        .eq('author_id', anonId)
        .order('created_at', { ascending: false })

      if (data) setPosts(data as unknown as Post[])
      setLoading(false)
    }
    fetch()
  }, [anonId])

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleDelete = async (postId: number) => {
    await supabase.from('posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
    setDeleteTarget(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">내 글 목록</h1>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>게시글을 삭제하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">작성한 글이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-card rounded-xl border p-4 sm:p-5 hover:shadow-sm transition-shadow">
              <Link href={`/board/${post.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${colorClass(getCategoryColor(post.category))}`}>
                    {getCategoryLabel(post.category)}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
              </Link>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatRelativeTime(post.created_at)}</span>
                  {getCommentCount(post) > 0 && (
                    <span className="flex items-center gap-1 text-primary font-medium">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {getCommentCount(post)}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" asChild className="text-xs h-auto px-2.5 py-1.5">
                    <Link href={`/board/${post.id}/edit`}>수정</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(post.id)}
                    className="text-xs text-destructive hover:text-destructive h-auto px-2.5 py-1.5"
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
