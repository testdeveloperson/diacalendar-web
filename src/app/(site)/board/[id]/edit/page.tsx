'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useCategories } from '@/hooks/useCategories'
import { colorActiveClass } from '@/lib/types'
import ImageUploader from '@/components/ImageUploader'

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
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-400">불러오는 중...</p>
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">카테고리</label>
          <div className="flex gap-2 flex-wrap">
            {availableCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  category === cat.id
                    ? colorActiveClass(cat.color)
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">제목</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-base text-gray-900 dark:text-gray-100 font-medium placeholder-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">내용</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력하세요"
            rows={14}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 resize-none leading-relaxed placeholder-gray-400"
          />
        </div>

        <ImageUploader images={imageUrls} onChange={setImageUrls} />

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? '수정 중...' : '수정 완료'}
          </button>
        </div>
      </form>
    </div>
  )
}
