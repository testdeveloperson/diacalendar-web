'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function WithdrawPage() {
  const { user, withdrawUser } = useAuth()
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleWithdraw = async () => {
    if (!confirmed) return
    setLoading(true)
    setError(null)

    const { error } = await withdrawUser()
    if (error) {
      setError(error)
      setLoading(false)
    } else {
      router.replace('/')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10 sm:mt-20">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">회원 탈퇴</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">탈퇴 전 아래 내용을 확인해 주세요</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 text-sm text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
          <p>• 탈퇴 후 계정은 즉시 비활성화되며 로그인이 불가합니다.</p>
          <p>• 작성하신 게시글과 댓글은 <span className="font-semibold text-gray-800 dark:text-gray-200">"탈퇴한 사용자"</span>로 표시되며 삭제되지 않습니다.</p>
          <p>• 개인정보는 관련 법령에 따라 <span className="font-semibold text-gray-800 dark:text-gray-200">6개월 후 완전 파기</span>됩니다.</p>
          <p>• 동일 이메일로 <span className="font-semibold text-gray-800 dark:text-gray-200">재가입이 제한</span>될 수 있습니다.</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-red-500 cursor-pointer flex-shrink-0"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">위 내용을 모두 확인하였으며, 회원 탈퇴에 동의합니다.</span>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 px-4 py-3 rounded-xl mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={!confirmed || loading}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : '탈퇴하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
