'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { computeAnonId } from '@/lib/anonId'

type OAuthProvider = 'google'

interface AuthContextType {
  user: User | null
  session: Session | null
  anonId: string | null
  nickname: string | null
  isAdmin: boolean
  isLoading: boolean
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
  setNicknameForUser: (nickname: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  withdrawUser: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function resolveProfile(email: string) {
  console.log('[Auth] resolveProfile start, email:', email)
  const id = await computeAnonId(email)
  console.log('[Auth] anonId computed:', id)
  const { data, error } = await supabase
    .from('profiles')
    .select('nickname, is_admin')
    .eq('id', id)
    .maybeSingle()
  console.log('[Auth] profile query result:', { data, error })
  return { anonId: id, nickname: data?.nickname ?? null, isAdmin: data?.is_admin ?? false }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [anonId, setAnonId] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const applySession = async (s: Session | null) => {
      if (cancelled) return
      setSession(s)
      setUser(s?.user ?? null)

      if (s?.user?.email) {
        try {
          const profile = await resolveProfile(s.user.email)
          if (cancelled) return
          setAnonId(profile.anonId)
          setNickname(profile.nickname)
          setIsAdmin(profile.isAdmin)
        } catch {
          // keep user logged in, profile just failed
        }
      } else {
        setAnonId(null)
        setNickname(null)
        setIsAdmin(false)
      }
    }

    // getSession으로 localStorage 세션 즉시 복원
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      console.log('[Auth] getSession result:', { hasSession: !!s, email: s?.user?.email, cancelled })
      await applySession(s)
      if (!cancelled) {
        console.log('[Auth] setIsLoading(false)')
        setIsLoading(false)
      } else {
        console.log('[Auth] cancelled, skipping setIsLoading')
      }
    }).catch((err) => {
      console.error('[Auth] getSession error:', err)
      if (!cancelled) setIsLoading(false)
    })

    // 이후 이벤트(로그인, 로그아웃, 토큰 갱신) 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'INITIAL_SESSION') return
      await applySession(s)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signInWithOAuth = async (provider: OAuthProvider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const setNicknameForUser = async (newNickname: string) => {
    if (!user || !anonId) return { error: '로그인이 필요합니다' }

    const termsAgreedAt = typeof window !== 'undefined'
      ? sessionStorage.getItem('terms_agreed_at')
      : null

    const { error } = await supabase.from('profiles').upsert({
      id: anonId,
      nickname: newNickname,
      ...(termsAgreedAt ? { terms_agreed_at: termsAgreedAt } : {}),
    })
    if (error) return { error: error.message }

    if (termsAgreedAt) sessionStorage.removeItem('terms_agreed_at')
    setNickname(newNickname)
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setAnonId(null)
    setNickname(null)
    setIsAdmin(false)
  }

  const withdrawUser = async () => {
    if (!user || !anonId) return { error: '로그인이 필요합니다' }

    const encoder = new TextEncoder()
    const emailBytes = encoder.encode(user.email?.toLowerCase() ?? '')
    const hashBuffer = await crypto.subtle.digest('SHA-256', emailBytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const emailHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const { error } = await supabase.from('profiles').update({
      deleted_at: new Date().toISOString(),
      nickname: '탈퇴한사용자',
      withdrawn_email_hash: emailHash,
    }).eq('id', anonId)

    if (error) return { error: error.message }

    await supabase.auth.signOut()
    setAnonId(null)
    setNickname(null)
    setIsAdmin(false)
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{
      user, session, anonId, nickname, isAdmin, isLoading,
      signInWithOAuth, setNicknameForUser, signOut, withdrawUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
