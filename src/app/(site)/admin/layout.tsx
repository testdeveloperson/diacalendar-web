'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, ShieldCheck, FileText, Users, TriangleAlert, Tag } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/posts', label: '게시글', icon: FileText },
  { href: '/admin/users', label: '사용자', icon: Users },
  { href: '/admin/reports', label: '신고', icon: TriangleAlert },
  { href: '/admin/categories', label: '카테고리', icon: Tag },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/board')
    }
  }, [isAdmin, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-4.5 h-4.5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold">관리자 패널</h1>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
