'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [anonId, setAnonId] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const mountedRef = useRef(true)

  const handleSession = useCallback(async (newSession: Session | null) => {
    if (!mountedRef.current) return
    setSession(newSession)
    setUser(newSession?.user ?? null)

    if (newSession?.user?.email) {
      try {
        const id = await computeAnonId(newSession.user.email)
        if (!mountedRef.current) return
        setAnonId(id)

        const { data } = await supabase
          .from('profiles')
          .select('nickname, is_admin')
          .eq('id', id)
          .maybeSingle()

        if (!mountedRef.current) return
        setNickname(data?.nickname ?? null)
        setIsAdmin(data?.is_admin ?? false)
      } catch {
        // profile fetch failed, keep user logged in with null nickname
      }
    } else {
      setAnonId(null)
      setNickname(null)
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    let initialDone = false

    // 1. getSession으로 localStorage 세션 즉시 복원
    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        await handleSession(currentSession)
      } catch {
        // ignore
      } finally {
        if (mountedRef.current) {
          initialDone = true
          setIsLoading(false)
        }
      }
    }
    initSession()

    // 2. 이후 이벤트(로그인, 로그아웃, 토큰 갱신) 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // INITIAL_SESSION은 getSession과 중복되므로 스킵
      if (event === 'INITIAL_SESSION') return
      await handleSession(newSession)
    })

    // 3. Safety fallback
    const timeout = setTimeout(() => {
      if (!initialDone && mountedRef.current) {
        setIsLoading(false)
      }
    }, 3000)

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [handleSession])

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
