'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { computeAnonId } from '@/lib/anonId'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'

export default function TermsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [loading, setLoading] = useState(false)

  const allAgreed = agreeTerms && agreePrivacy

  const handleNext = async () => {
    if (!allAgreed) return
    setLoading(true)

    const now = new Date().toISOString()

    if (user?.email) {
      const anonId = await computeAnonId(user.email)
      await supabase.from('profiles').upsert({
        id: anonId,
        terms_agreed_at: now,
      })
    }

    sessionStorage.setItem('terms_agreed_at', now)
    router.push('/auth/nickname')
  }

  return (
    <div className="max-w-lg mx-auto mt-6 sm:mt-12 pb-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">서비스 이용 동의</CardTitle>
          <CardDescription>가입 전 아래 약관을 확인해 주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 전체 동의 */}
          <label className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg cursor-pointer">
            <Checkbox
              checked={allAgreed}
              onCheckedChange={(checked) => {
                const val = checked === true
                setAgreeTerms(val)
                setAgreePrivacy(val)
              }}
            />
            <span className="font-bold text-primary text-sm">전체 동의하기</span>
          </label>

          {/* 이용약관 */}
          <div className="border rounded-lg overflow-hidden">
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-muted/50">
              <Checkbox
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
              />
              <span className="text-sm font-semibold">[필수] 서비스 이용약관 동의</span>
            </label>
            <ScrollArea className="h-48 border-t">
              <div className="px-4 py-3 text-xs text-muted-foreground leading-relaxed space-y-3">
                <p className="font-semibold text-foreground">제 1 조 (목적)</p>
                <p>본 약관은 커뮤니티 서비스(이하 &quot;서비스&quot;) 내에서 회원 간의 건강하고 자유로운 소통을 보호하고, 서비스 이용 조건 및 운영자와 회원 간의 권리와 의무, 책임 사항을 규정함을 목적으로 합니다.</p>

                <p className="font-semibold text-foreground">제 2 조 (게시물에 대한 책임 및 운영자의 면책)</p>
                <p>① 회원이 서비스 내에 작성한 게시물(댓글 포함)의 모든 법적 책임(명예훼손, 모욕, 저작권 침해, 영업비밀 유출 등)은 전적으로 작성자 본인에게 있습니다.</p>
                <p>② 운영자는 회원이 등록한 게시물의 신뢰도, 정확성, 적법성을 보증하지 않으며, 게시물로 인해 발생하는 어떠한 민·형사상 문제에 대해서도 법적 책임을 지지 않습니다.</p>
                <p>③ 본 서비스는 직장 동료 간의 편안한 소통을 위한 공간입니다. 회사의 영업비밀, 고객 개인정보, 미발표 프로젝트 등 보안 위반 소지가 있는 정보의 게재를 엄격히 금지하며, 이로 인해 발생하는 회사와의 분쟁에 대해 운영자는 일절 개입하거나 책임지지 않습니다.</p>

                <p className="font-semibold text-foreground">제 3 조 (권리 침해 신고 및 임시조치)</p>
                <p>① 타인의 게시물로 인해 명예훼손, 사생활 침해 등의 피해를 입은 회원은 운영자에게 해당 게시물의 삭제 또는 블라인드 처리를 요청할 수 있습니다.</p>
                <p>② 신고가 접수되거나 다수의 사용자로부터 신고가 누적된 게시물은 관련 법령(정보통신망법) 및 내부 규정에 따라 최대 30일간 임시조치(블라인드) 되며, 이후 정당한 소명이 없을 시 영구 삭제됩니다.</p>

                <p className="font-semibold text-foreground">제 4 조 (수사기관 협조)</p>
                <p>본 서비스는 익명성을 존중하나, 범죄 행위(심각한 명예훼손, 성범죄, 협박 등)와 관련하여 수사기관의 적법한 절차에 따른 정보 제공 요청이 있을 경우, 관련 법령에 의거하여 보관 중인 접속 로그 및 가입 정보를 제공할 수 있습니다.</p>
              </div>
            </ScrollArea>
          </div>

          {/* 개인정보 수집 및 이용 동의 */}
          <div className="border rounded-lg overflow-hidden">
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-muted/50">
              <Checkbox
                checked={agreePrivacy}
                onCheckedChange={(checked) => setAgreePrivacy(checked === true)}
              />
              <span className="text-sm font-semibold">[필수] 개인정보 수집 및 이용 동의</span>
            </label>
            <ScrollArea className="h-48 border-t">
              <div className="px-4 py-3 text-xs text-muted-foreground leading-relaxed space-y-3">
                <p className="font-semibold text-foreground">1. 수집하는 개인정보 항목</p>
                <p>커뮤니티의 원활한 서비스 제공과 불량 이용자 제재를 위해 아래와 같은 최소한의 개인정보를 수집합니다.</p>
                <p>• 가입 시 수집 항목: 이메일, 닉네임(한글 5자 이내)</p>
                <p>• 서비스 이용 과정에서 자동 수집되는 항목: 접속 IP 주소, 서비스 이용 기록, 접속 로그, 쿠키(Cookie)</p>

                <p className="font-semibold text-foreground">2. 개인정보의 수집 및 이용 목적</p>
                <p>• 회원 관리: 본인 확인, 개인 식별, 불량 회원의 부정 이용 방지, 가입 의사 확인</p>
                <p>• 서비스 제공: 게시판 글 작성 및 커뮤니티 활동 지원</p>
                <p>• 민원 처리: 이용자 분쟁 조정을 위한 기록 보존, 불만 처리, 공지사항 전달</p>

                <p className="font-semibold text-foreground">3. 개인정보의 보유 및 이용 기간</p>
                <p>이용자의 개인정보는 원칙적으로 수집 및 이용 목적이 달성되면 지체 없이 파기합니다. 단, 부정이용 기록(가이드라인 위반으로 인한 제재 회원의 정보)은 재가입 방지를 위해 탈퇴일로부터 6개월간 보관 후 파기하며, 웹사이트 방문 기록 및 로그 기록은 통신비밀보호법에 의거하여 3개월 보관합니다.</p>

                <p className="font-semibold text-foreground">4. 동의를 거부할 권리 및 불이익 안내</p>
                <p>이용자는 본 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 단, 본 동의는 커뮤니티 서비스 가입 및 이용을 위한 필수 사항이므로, 동의를 거부하실 경우 회원가입 및 서비스 이용이 제한됩니다.</p>
              </div>
            </ScrollArea>
          </div>

          <Button
            onClick={handleNext}
            disabled={!allAgreed || loading}
            className="w-full"
            size="lg"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            동의하고 다음 단계로
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
