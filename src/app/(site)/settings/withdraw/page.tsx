'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { TriangleAlert, AlertCircle, Loader2 } from 'lucide-react'

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
      <div className="bg-card rounded-2xl border p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TriangleAlert className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">회원 탈퇴</h1>
          <p className="text-sm text-muted-foreground mt-1">탈퇴 전 아래 내용을 확인해 주세요</p>
        </div>

        <div className="bg-muted rounded-xl p-4 mb-5 text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>• 탈퇴 후 계정은 즉시 비활성화되며 로그인이 불가합니다.</p>
          <p>• 작성하신 게시글과 댓글은 <span className="font-semibold text-foreground">&quot;탈퇴한 사용자&quot;</span>로 표시되며 삭제되지 않습니다.</p>
          <p>• 개인정보는 관련 법령에 따라 <span className="font-semibold text-foreground">6개월 후 완전 파기</span>됩니다.</p>
          <p>• 동일 이메일로 <span className="font-semibold text-foreground">재가입이 제한</span>될 수 있습니다.</p>
        </div>

        <div className="flex items-start gap-3 mb-5">
          <Checkbox
            id="withdraw-confirm"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
            className="mt-0.5"
          />
          <Label htmlFor="withdraw-confirm" className="text-sm text-foreground cursor-pointer leading-relaxed">
            위 내용을 모두 확인하였으며, 회원 탈퇴에 동의합니다.
          </Label>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-xl mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleWithdraw}
            disabled={!confirmed || loading}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />처리 중...</> : '탈퇴하기'}
          </Button>
        </div>
      </div>
    </div>
  )
}
