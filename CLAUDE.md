# DiaCalendar Web

> DiaCalendar 앱의 랜딩페이지 + 게시판(커뮤니티) 기능을 웹으로 구현한 프로젝트

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **UI** | Tailwind CSS |
| **Backend** | Supabase (기존 앱과 동일한 프로젝트 공유) |
| **Auth** | Supabase Auth (이메일/비밀번호) |
| **Storage** | Cloudflare R2 (이미지 업로드, WebP 변환) |
| **Deploy** | Vercel (GitHub 연동 자동 배포) |

## Supabase 연동

- 앱(Android)과 동일한 Supabase 프로젝트를 사용
- `.env.local`에 URL과 anon key 저장
- Supabase JS 클라이언트가 PostgREST API 직접 호출
- RLS 정책은 서버에 이미 설정되어 있음

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (AuthProvider만 — Header 없음)
│   ├── page.tsx                # / 랜딩페이지 (히어로, 기능 소개, 앱 다운로드 CTA)
│   ├── globals.css             # Tailwind 글로벌 스타일 + 다크모드 + 애니메이션
│   ├── api/
│   │   └── upload/route.ts     # 이미지 업로드 API (R2, JWT 인증, WebP 변환)
│   └── (site)/                 # Route Group — Header + max-w-4xl 래퍼 포함
│       ├── layout.tsx          # (site) 그룹 레이아웃 (Header, main 래퍼)
│       ├── auth/
│       │   ├── terms/page.tsx      # 약관 동의 (이용약관 + 개인정보 수집 동의) ← 가입 첫 단계
│       │   ├── login/page.tsx      # 로그인
│       │   ├── signup/page.tsx     # 회원가입 (이메일 인증 OTP)
│       │   ├── nickname/page.tsx   # 닉네임 설정 (한글 1~5자)
│       │   └── recover/page.tsx    # 비밀번호 찾기
│       ├── board/
│       │   ├── page.tsx            # 게시판 목록 (카테고리 필터, 검색, 페이지네이션)
│       │   ├── write/page.tsx      # 글 작성 (이미지 첨부 포함)
│       │   ├── [id]/
│       │   │   ├── page.tsx        # 게시글 상세 + 이미지 갤러리/라이트박스 + 댓글 + 신고/차단 + 좋아요/싫어요
│       │   │   └── edit/page.tsx   # 글 수정 (이미지 첨부 포함)
│       │   └── my/page.tsx         # 내 글 목록
│       ├── admin/
│       │   ├── layout.tsx          # 관리자 전용 레이아웃 (접근 제어 + 탭 네비게이션)
│       │   ├── page.tsx            # /admin → /admin/posts 리다이렉트
│       │   ├── posts/page.tsx      # 게시글 관리 (삭제, 카테고리 변경)
│       │   ├── users/page.tsx      # 사용자 관리 (삭제, 관리자 권한 토글)
│       │   ├── reports/page.tsx    # 신고 관리 (원글 삭제, 신고 기각)
│       │   └── categories/page.tsx # 카테고리 관리 (추가/수정/삭제)
│       └── settings/
│           ├── blocked/page.tsx    # 차단 사용자 관리
│           └── withdraw/page.tsx   # 회원 탈퇴 (Soft Delete)
├── lib/
│   ├── supabase.ts             # Supabase 클라이언트 초기화
│   └── types.ts                # 타입 정의 + 유틸 함수
├── hooks/
│   └── useAuth.tsx             # AuthProvider Context + useAuth 훅 (isAdmin, withdrawUser 포함)
└── components/
    ├── Header.tsx              # 상단 네비게이션 (로그인/메뉴 드롭다운, 관리자 링크, 탈퇴 링크)
    ├── PostCard.tsx            # 게시글 카드 (카테고리 배지, 미리보기, 조회수/좋아요/이미지수), prefetch={false}
    ├── ImageUploader.tsx       # 이미지 첨부 컴포넌트 (최대 5장, 썸네일 그리드, 삭제)
    ├── CategoryFilter.tsx      # 카테고리 필터 드롭다운 (커스텀, 외부클릭 닫힘)
    ├── CommentItem.tsx         # 댓글 (1단계 대댓글, 삭제/신고/차단)
    ├── CommentInput.tsx        # 댓글 입력 바 (답글 대상 표시)
    └── ReportDialog.tsx        # 신고 다이얼로그 (4가지 사유)
```

## 구현된 기능

### ✅ 완료
- [x] 이메일/비밀번호 인증 (로그인, 회원가입 OTP, 비밀번호 찾기/재설정)
- [x] 게시글 CRUD (동적 카테고리, DB 주도)
- [x] 이미지 업로드 (Cloudflare R2, 최대 5장, WebP 변환, GIF 원본 유지)
- [x] 이미지 갤러리 + 라이트박스 (게시글 상세)
- [x] 제목+내용 검색
- [x] 페이지네이션 (더 보기 버튼, PAGE_SIZE=20)
- [x] 정렬 (최신순/조회순/좋아요순/싫어요순)
- [x] 댓글 + 1단계 대댓글
- [x] 댓글 소프트 삭제 ("삭제된 메시지입니다" 표시)
- [x] 게시글/댓글 신고 (스팸, 욕설, 부적절, 기타)
- [x] 사용자 차단/해제 (차단 시 글 숨김)
- [x] 내 글 목록 (수정/삭제)
- [x] URL 자동 링크 (본문 내 URL 클릭 가능)
- [x] 상대 시간 표시 (방금 전, N분 전, N시간 전 등)
- [x] 조회수 (로그인 사용자 1회 중복 방지, post_views 테이블)
- [x] 좋아요/싫어요 (토글 방식, 중복 방지, post_reactions 테이블)
- [x] 관리자 패널 (/admin) - 게시글·사용자·신고·카테고리 관리
- [x] 새 글 알림 뱃지 (마지막 방문 시간 기준, localStorage)
- [x] 카테고리 필터 드롭다운 (모바일 대응)
- [x] 네트워크 에러 처리 (목록 로드 실패 시 에러+재시도, 댓글 실패 시 스낵바)
- [x] 랜딩페이지 (히어로, 기능 소개 카드, 다크모드)
- [x] 약관 동의 (가입 첫 단계 — 이용약관 + 개인정보 수집 동의, 동의 시각 DB 저장)
- [x] 닉네임 조건 안내 (한글 1~5자, 중복 확인)
- [x] 비밀번호 안내 (8자 이상, 대소문자·숫자·특수문자 권장)
- [x] 회원 탈퇴 (Soft Delete — deleted_at 기록, 이메일 해시 보존, 탈퇴 계정 로그인 차단)

### 🚧 추가 가능한 기능
- [ ] 닉네임 변경 (설정 페이지)
- [ ] 실시간 알림 (Supabase Realtime)
- [ ] PWA 지원
- [ ] 앱 스토어 링크 추가 (랜딩페이지 App Store / Google Play 버튼)

## Supabase 데이터베이스 스키마

```
posts          - id, author_id, category, title, content, image_urls(TEXT[]), created_at
comments       - id, post_id, parent_id(nullable), author_id, content, is_deleted, created_at
reports        - id, reporter_id, content_type, content_id, target_author_id, reason
blocks         - id, blocker_id, blocked_id, created_at
profiles       - id(=auth.users.id), nickname, is_admin(boolean), terms_agreed_at(TIMESTAMPTZ),
                 deleted_at(TIMESTAMPTZ), withdrawn_email_hash(TEXT)
post_views     - id, post_id, user_id, created_at  ※ UNIQUE(post_id, user_id)
post_reactions - id, post_id, user_id, reaction('LIKE'|'DISLIKE'), created_at  ※ UNIQUE(post_id, user_id)
categories     - id(TEXT PK), label, color, sort_order, created_at
```

### 스키마 변경 이력 (추가된 컬럼)
```sql
-- 이미지 업로드 지원
ALTER TABLE posts ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- 약관 동의 기록
ALTER TABLE profiles ADD COLUMN terms_agreed_at TIMESTAMPTZ;

-- 회원 탈퇴 Soft Delete
ALTER TABLE profiles
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN withdrawn_email_hash TEXT;
```

## 환경 변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
R2_ACCOUNT_ID=           # Cloudflare Account ID (서버 전용)
R2_ACCESS_KEY_ID=        # R2 API 토큰 (서버 전용)
R2_SECRET_ACCESS_KEY=    # R2 API 시크릿 (서버 전용)
R2_BUCKET_NAME=          # R2 버킷 이름
NEXT_PUBLIC_R2_PUBLIC_URL= # R2 퍼블릭 도메인 (예: https://pub-xxx.r2.dev)
```

## 이미지 업로드 구조

- **API Route**: `POST /api/upload` — Supabase JWT 인증 후 R2에 업로드
- **파일 제한**: 최대 5MB, JPG/PNG/GIF/WebP 허용
- **변환**: JPG/PNG/WebP → WebP (quality 85, 최대 너비 2000px), GIF는 원본 유지
- **파일 경로**: `posts/{userId}/{timestamp}-{randomId}.{ext}`
- **sharp**: `optionalDependencies` + 동적 import (`await import('sharp')`) — Vercel 호환
- **R2 Lifecycle Rule**: 180일 후 자동 삭제 (prefix: `posts/`)

## 회원가입 흐름

```
/auth/terms (약관 동의)
  → sessionStorage에 terms_agreed_at 저장
  → /auth/signup (이메일/비밀번호 입력)
  → OTP 이메일 인증
  → /auth/nickname (닉네임 설정)
  → DB에 terms_agreed_at 저장 후 /board
```

- `/auth/signup` 직접 접근 시 terms_agreed_at 없으면 `/auth/terms`로 리다이렉트
- 닉네임 조건: 한글 1~5자 (`/^[가-힣]{1,5}$/`)
- 비밀번호: 8자 이상 (대소문자 + 숫자 + 특수문자 권장)

## 회원 탈퇴 (Soft Delete)

- **탈퇴 처리**: `profiles.deleted_at = now()`, `nickname = '탈퇴한사용자'`, `withdrawn_email_hash = SHA-256(email)`
- **로그인 차단**: `signIn` 시 `deleted_at` 확인 → 탈퇴 계정이면 즉시 로그아웃 + 에러
- **게시글**: 삭제되지 않고 "탈퇴한 사용자"로 표시
- **실제 파기**: 6개월 후 관리자가 Supabase 대시보드에서 수동 삭제 (auth.users + profiles)
- **진입**: 헤더 드롭다운 → "회원 탈퇴" → `/settings/withdraw`

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
const { user, nickname, isAdmin, signIn, signOut, withdrawUser } = useAuth()
```

### 차단 사용자 필터링
```typescript
// 클라이언트 사이드 필터링 (앱과 동일)
const filtered = posts.filter(p => !blockedIds.has(p.author_id))
```

### 조회수/반응 카운트 집계 (목록)
```typescript
// POST_SELECT에 포함 — reaction 컬럼까지 가져와 LIKE/DISLIKE 각각 집계
'post_views(count),post_reactions(reaction)'
// 파싱
p.view_count = (p.post_views as unknown as { count: number }[])?.[0]?.count ?? 0
const reactions = p.post_reactions as unknown as { reaction: string }[]
p.like_count = reactions?.filter(r => r.reaction === 'LIKE').length ?? 0
p.dislike_count = reactions?.filter(r => r.reaction === 'DISLIKE').length ?? 0
```

### Vercel 배포
- GitHub push → 자동 배포 (레포지토리는 반드시 Public 유지)
- `sharp`는 `optionalDependencies` + 동적 import 필수 (정적 import 시 빌드 실패)
- Vercel 환경 변수에 R2 관련 키 5개 등록 필요

### Route Group 구조
- `(site)/` — Header + `max-w-4xl` 래퍼가 필요한 모든 페이지 (board, auth, admin, settings)
- 루트 레이아웃은 Provider만 감싸고 Header 없음 → 랜딩페이지가 독립적인 레이아웃 사용 가능
- URL은 Route Group 괄호 이름에 영향받지 않음 (`/board`, `/auth/login` 등 그대로)

### 랜딩페이지 다크모드
- CSS `prefers-color-scheme` media query로 자동 감지 (Tailwind dark: 클래스 미사용)
- `globals.css`에 `@media (prefers-color-scheme: dark)` 블록으로 body 배경/색상 전환

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
