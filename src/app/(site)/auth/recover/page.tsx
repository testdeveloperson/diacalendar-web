'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function RecoverPage() {
  const { recoverPassword, verifyRecoveryOtp, updatePassword } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await recoverPassword(email)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      setStep('otp')
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await verifyRecoveryOtp(email, otp)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      setStep('password')
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await updatePassword(newPassword)
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      router.push('/board')
    }
  }

  if (step === 'password') {
    return (
      <div className="max-w-sm mx-auto mt-10 sm:mt-20">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">새 비밀번호 설정</h1>
            <p className="text-sm text-gray-400 mt-1">새로운 비밀번호를 입력해주세요</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm placeholder-gray-400"
                placeholder="6자 이상"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="max-w-sm mx-auto mt-10 sm:mt-20">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">이메일 인증</h1>
            <p className="text-sm text-gray-400 mt-1">
              {email}으로<br />인증번호를 발송했습니다
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">인증번호</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm placeholder-gray-400 text-center text-lg tracking-widest"
                placeholder="000000"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            >
              {loading ? '확인 중...' : '인증 확인'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20">
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h1>
          <p className="text-sm text-gray-400 mt-1">가입한 이메일로 인증번호를 보내드립니다</p>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm placeholder-gray-400"
              placeholder="가입한 이메일을 입력하세요"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? '발송 중...' : '인증번호 보내기'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm">
          <Link href="/auth/login" className="text-gray-400 hover:text-gray-600">로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  )
}
