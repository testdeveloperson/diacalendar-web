import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  // Supabase JWT로 인증 확인
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, GIF, WEBP 형식만 지원합니다' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다' }, { status: 400 })
  }

  const input = Buffer.from(await file.arrayBuffer())
  const isGif = file.type === 'image/gif'
  const randomId = Math.random().toString(36).slice(2)

  let body: Buffer
  let contentType: string
  let ext: string

  if (isGif) {
    // GIF는 원본 유지 (애니메이션 보존)
    body = input
    contentType = 'image/gif'
    ext = 'gif'
  } else {
    // JPG / PNG / WebP → WebP로 변환 (품질 85, 최대 너비 2000px)
    body = await sharp(input)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
    contentType = 'image/webp'
    ext = 'webp'
  }

  const key = `posts/${user.id}/${Date.now()}-${randomId}.${ext}`

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))

  const url = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`
  return NextResponse.json({ url })
}
