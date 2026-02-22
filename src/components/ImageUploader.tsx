'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface ImageUploaderProps {
  images: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
}

export default function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList) => {
    const remaining = maxImages - images.length
    if (remaining <= 0) return

    const selected = Array.from(files).slice(0, remaining)
    setError(null)
    setUploading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('로그인이 필요합니다')
      setUploading(false)
      return
    }

    const newUrls: string[] = []
    for (const file of selected) {
      if (file.size > 20 * 1024 * 1024) {
        setError(`${file.name}: 파일 크기는 20MB 이하여야 합니다`)
        continue
      }
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? '업로드에 실패했습니다')
      } else {
        newUrls.push(json.url)
      }
    }

    onChange([...images, ...newUrls])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleRemove = (url: string) => {
    onChange(images.filter(u => u !== url))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        이미지 첨부 <span className="text-xs text-gray-400 font-normal">({images.length}/{maxImages})</span>
      </label>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
              <Image
                src={url}
                alt={`첨부 이미지 ${i + 1}`}
                fill
                className="object-cover"
                sizes="96px"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="이미지 삭제"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              이미지 추가
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
