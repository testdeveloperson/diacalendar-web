'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  nickname: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, nickname: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  recoverPassword: (email: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNickname = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', userId)
      .single()
    setNickname(data?.nickname ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchNickname(session.user.id)
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchNickname(session.user.id)
      } else {
        setNickname(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: '이메일 또는 비밀번호가 올바르지 않습니다' }
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: '이메일 인증이 완료되지 않았습니다' }
      }
      return { error: error.message }
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string, nickname: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      if (error.message.includes('User already registered')) {
        return { error: '이미 가입된 이메일입니다' }
      }
      if (error.message.includes('Password should be at least')) {
        return { error: '비밀번호는 6자 이상이어야 합니다' }
      }
      return { error: error.message }
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        nickname,
      })
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setNickname(null)
  }

  const recoverPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) return { error: error.message }
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, session, nickname, isLoading, signIn, signUp, signOut, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
