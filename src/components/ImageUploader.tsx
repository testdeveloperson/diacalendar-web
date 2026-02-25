'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ImagePlus, X, Loader2 } from 'lucide-react'

interface ImageUploaderProps {
  images: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
}

export default function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (file.type === 'image/gif') { resolve(file); return }
      const img = document.createElement('img')
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX_WIDTH = 2000
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (!blob) { resolve(file); return }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.85
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

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
      if (file.size > 50 * 1024 * 1024) {
        setError(`${file.name}: 파일 크기는 50MB 이하여야 합니다`)
        continue
      }
      const compressed = await compressImage(file)
      const form = new FormData()
      form.append('file', compressed)
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
      <Label>
        이미지 첨부 <span className="text-xs text-muted-foreground font-normal">({images.length}/{maxImages})</span>
      </Label>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border group">
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
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-dashed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4 mr-2" />
              이미지 추가
            </>
          )}
        </Button>
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
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
