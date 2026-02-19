# DiaCalendar Web 게시판

> DiaCalendar 앱의 게시판(커뮤니티) 기능을 웹으로 구현한 프로젝트

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **UI** | Tailwind CSS |
| **Backend** | Supabase (기존 앱과 동일한 프로젝트 공유) |
| **Auth** | Supabase Auth (이메일/비밀번호) |

## Supabase 연동

- 앱(Android)과 동일한 Supabase 프로젝트를 사용
- `.env.local`에 URL과 anon key 저장
- Supabase JS 클라이언트가 PostgREST API 직접 호출
- RLS 정책은 서버에 이미 설정되어 있음

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (AuthProvider, Header)
│   ├── page.tsx                # / → /board 리다이렉트
│   ├── globals.css             # Tailwind 글로벌 스타일
│   ├── auth/
│   │   ├── login/page.tsx      # 로그인
│   │   ├── signup/page.tsx     # 회원가입 (이메일 인증 안내)
│   │   └── recover/page.tsx    # 비밀번호 찾기
│   ├── board/
│   │   ├── page.tsx            # 게시판 목록 (카테고리 필터, 검색, 페이지네이션)
│   │   ├── write/page.tsx      # 글 작성
│   │   ├── [id]/
│   │   │   ├── page.tsx        # 게시글 상세 + 댓글 + 신고/차단 + 좋아요/싫어요
│   │   │   └── edit/page.tsx   # 글 수정
│   │   └── my/page.tsx         # 내 글 목록
│   ├── admin/
│   │   ├── layout.tsx          # 관리자 전용 레이아웃 (접근 제어 + 탭 네비게이션)
│   │   ├── page.tsx            # /admin → /admin/posts 리다이렉트
│   │   ├── posts/page.tsx      # 게시글 관리 (삭제, 카테고리 변경)
│   │   ├── users/page.tsx      # 사용자 관리 (삭제, 관리자 권한 토글)
│   │   ├── reports/page.tsx    # 신고 관리 (원글 삭제, 신고 기각)
│   │   └── categories/page.tsx # 카테고리 관리 (추가/수정/삭제)
│   └── settings/
│       └── blocked/page.tsx    # 차단 사용자 관리
├── lib/
│   ├── supabase.ts             # Supabase 클라이언트 초기화
│   └── types.ts                # 타입 정의 + 유틸 함수
├── hooks/
│   └── useAuth.tsx             # AuthProvider Context + useAuth 훅 (isAdmin 포함)
└── components/
    ├── Header.tsx              # 상단 네비게이션 (로그인/메뉴 드롭다운, 관리자 링크)
    ├── PostCard.tsx            # 게시글 카드 (카테고리 배지, 미리보기, 조회수/좋아요)
    ├── CategoryFilter.tsx      # 카테고리 필터 칩 (전체/자유게시판/Q&A)
    ├── CommentItem.tsx         # 댓글 (1단계 대댓글, 삭제/신고/차단)
    ├── CommentInput.tsx        # 댓글 입력 바 (답글 대상 표시)
    └── ReportDialog.tsx        # 신고 다이얼로그 (4가지 사유)
```

## 구현된 기능 (앱과 동일)

### ✅ 완료
- [x] 이메일/비밀번호 인증 (로그인, 회원가입, 비밀번호 찾기)
- [x] 게시글 CRUD (자유게시판, Q&A 카테고리)
- [x] 제목+내용 검색
- [x] 페이지네이션 (더 보기 버튼, PAGE_SIZE=20)
- [x] 댓글 + 1단계 대댓글
- [x] 댓글 소프트 삭제 ("삭제된 메시지입니다" 표시)
- [x] 게시글/댓글 신고 (스팸, 욕설, 부적절, 기타)
- [x] 사용자 차단/해제 (차단 시 글 숨김)
- [x] 내 글 목록 (수정/삭제)
- [x] 커뮤니티 가이드라인 동의 (localStorage)
- [x] URL 자동 링크 (본문 내 URL 클릭 가능)
- [x] 상대 시간 표시 (방금 전, N분 전, N시간 전 등)
- [x] 조회수 (로그인 사용자 1회 중복 방지, post_views 테이블)
- [x] 좋아요/싫어요 (토글 방식, 중복 방지, post_reactions 테이블)
- [x] 관리자 패널 (/admin) - 게시글·사용자·신고·카테고리 관리

### 🚧 추가 가능한 기능
- [ ] 프로필 수정 (닉네임 변경)
- [ ] 비밀번호 변경
- [ ] 이미지 업로드 (Supabase Storage)
- [ ] 실시간 알림 (Supabase Realtime)
- [ ] PWA 지원
- [ ] Vercel 배포

## Supabase 데이터베이스 스키마

```
posts          - id, author_id, category, title, content, created_at
comments       - id, post_id, parent_id(nullable), author_id, content, is_deleted, created_at
reports        - id, reporter_id, content_type, content_id, target_author_id, reason
blocks         - id, blocker_id, blocked_id, created_at
profiles       - id(=auth.users.id), nickname, is_admin(boolean, default false)
post_views     - id, post_id, user_id, created_at  ※ UNIQUE(post_id, user_id)
post_reactions - id, post_id, user_id, reaction('LIKE'|'DISLIKE'), created_at  ※ UNIQUE(post_id, user_id)
categories     - id(TEXT PK), label, color, sort_order, created_at
```

## 관리자 시스템

### 관리자 지정
```sql
UPDATE profiles SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = '관리자이메일');
```

### 관리자 RLS 정책 (Supabase에 등록 필요)
```sql
CREATE POLICY "Admin can delete any post" ON posts FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admin can delete any comment" ON comments FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admin can update any comment" ON comments FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admin can delete any profile" ON profiles FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
```

### 관리자 접근
- `profiles.is_admin = true`인 계정으로 로그인 시 헤더에 "관리자 패널" 메뉴 표시
- `/admin` 경로: 비관리자 접근 시 `/board`로 자동 리다이렉트
- 사용자 삭제: profiles 삭제 → CASCADE로 posts, comments 자동 삭제 (auth.users는 Supabase 대시보드에서 별도 삭제)

## 주요 패턴

### Supabase 타입 캐스팅
Supabase JS의 자동 타입 추론이 join 관계를 배열로 반환하므로, `as unknown as Post` 패턴을 사용:
```typescript
const { data } = await supabase.from('posts').select('...,profiles(nickname)').single()
if (data) setPost(data as unknown as Post)
```

### 인증 상태 관리
```typescript
// AuthProvider가 onAuthStateChange 구독
// useAuth() 훅으로 어디서든 접근
const { user, nickname, isAdmin, signIn, signOut } = useAuth()
```

### 차단 사용자 필터링
```typescript
// 클라이언트 사이드 필터링 (앱과 동일)
const filtered = posts.filter(p => !blockedIds.has(p.author_id))
```

### 조회수/반응 카운트 집계 (목록)
```typescript
// POST_SELECT에 포함
'post_views(count),post_reactions(count)'
// 파싱
p.view_count = (p.post_views as unknown as { count: number }[])?.[0]?.count ?? 0
```

## 명령어

```bash
# 개발 서버
npm run dev        # http://localhost:3000

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 연관 프로젝트

- **DiaCalendar2** (Android 앱): `~/Desktop/MyProject/DiaCalendar2/`
  - 동일한 Supabase 백엔드 공유
  - 앱의 게시판 코드: `presentation/board/`, `data/remote/api/SupabaseBoardApi.kt`
