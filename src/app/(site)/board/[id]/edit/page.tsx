'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { colorActiveClass } from '@/lib/types'
import ImageUploader from '@/components/ImageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, AlertCircle } from 'lucide-react'

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>()
  const { user, anonId, isAdmin } = useAuth()
  const router = useRouter()
  const { categories } = useCategories()
  const availableCategories = categories.filter(cat => !cat.admin_only || isAdmin)
  const [category, setCategory] = useState<string>('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from('posts')
        .select('category,title,content,author_id,image_urls')
        .eq('id', id)
        .single()

      if (data) {
        if (anonId && data.author_id !== anonId) {
          router.push('/board')
          return
        }
        setCategory(data.category)
        setTitle(data.title)
        setContent(data.content)
        setImageUrls((data.image_urls as string[]) ?? [])
      }
      setFetching(false)
    }
    fetchPost()
  }, [id, user, router])

  if (!user) {
    router.push('/auth/login')
    return null
  }

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요')
      return
    }
    setError(null)
    setLoading(true)

    const { error: err } = await supabase
      .from('posts')
      .update({
        category,
        title: title.trim(),
        content: content.trim(),
        image_urls: imageUrls,
      })
      .eq('id', id)

    if (err) {
      setError('수정에 실패했습니다')
      setLoading(false)
    } else {
      router.push(`/board/${id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">글 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label className="mb-2">카테고리</Label>
          <div className="flex gap-2 flex-wrap">
            {availableCategories.map(cat => (
              <Button
                key={cat.id}
                type="button"
                variant={category === cat.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setCategory(cat.id)}
                className={category === cat.id ? colorActiveClass(cat.color) : ''}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2">제목</Label>
          <Input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div>
          <Label className="mb-2">내용</Label>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={14}
            className="resize-none"
          />
        </div>

        <ImageUploader images={imageUrls} onChange={setImageUrls} />

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? '수정 중...' : '수정 완료'}
          </Button>
        </div>
      </form>
    </div>
  )
}
