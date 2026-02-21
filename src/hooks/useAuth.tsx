'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  nickname: string | null
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>
  setNicknameForUser: (nickname: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  recoverPassword: (email: string) => Promise<{ error: string | null }>
  verifyRecoveryOtp: (email: string, token: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNickname = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('nickname, is_admin')
      .eq('id', userId)
      .single()
    setNickname(data?.nickname ?? null)
    setIsAdmin(data?.is_admin ?? false)
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
        setIsAdmin(false)
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

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
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

    return { error: null }
  }

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })
    if (error) {
      if (error.message.includes('Token has expired')) {
        return { error: '인증번호가 만료되었습니다. 다시 가입해주세요.' }
      }
      if (error.message.includes('Invalid') || error.message.includes('invalid')) {
        return { error: '인증번호가 올바르지 않습니다' }
      }
      return { error: error.message }
    }
    return { error: null }
  }

  const setNicknameForUser = async (newNickname: string) => {
    if (!user) return { error: '로그인이 필요합니다' }

    // 약관 동의 시간 기록 (sessionStorage에서 가져와 DB에 저장)
    const termsAgreedAt = typeof window !== 'undefined'
      ? sessionStorage.getItem('terms_agreed_at')
      : null

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
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
    setNickname(null)
    setIsAdmin(false)
  }

  const recoverPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) return { error: error.message }
    return { error: null }
  }

  const verifyRecoveryOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    })
    if (error) {
      if (error.message.includes('Token has expired')) {
        return { error: '인증번호가 만료되었습니다. 다시 시도해주세요.' }
      }
      if (error.message.includes('Invalid') || error.message.includes('invalid')) {
        return { error: '인증번호가 올바르지 않습니다' }
      }
      return { error: error.message }
    }
    return { error: null }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, session, nickname, isAdmin, isLoading, signIn, signUp, verifyOtp, setNicknameForUser, signOut, recoverPassword, verifyRecoveryOtp, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
