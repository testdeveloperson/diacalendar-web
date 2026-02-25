# DiaCalendar Web

> DiaCalendar 앱의 랜딩페이지 + 게시판(커뮤니티) 기능을 웹으로 구현한 프로젝트

## 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **UI** | Tailwind CSS + shadcn/ui + lucide-react |
| **Theme** | next-themes (시스템/라이트/다크) |
| **Backend** | Supabase (기존 앱과 동일한 프로젝트 공유) |
| **Auth** | Supabase Auth (OAuth — Google, Kakao, Apple) |
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
│   ├── layout.tsx              # 루트 레이아웃 (ThemeProvider + AuthProvider + Toaster)
│   ├── page.tsx                # / 랜딩페이지 (히어로, 기능 소개, 앱 다운로드 CTA)
│   ├── globals.css             # Tailwind + shadcn CSS 변수 + 다크모드 + 애니메이션
│   ├── api/
│   │   └── upload/route.ts     # 이미지 업로드 API (R2, JWT 인증, WebP 변환, anonId 경로)
│   └── (site)/                 # Route Group — Header + max-w-4xl 래퍼 포함
│       ├── layout.tsx          # (site) 그룹 레이아웃 (Header, main 래퍼)
│       ├── auth/
│       │   ├── callback/page.tsx   # OAuth 콜백 (세션→anonId→프로필 확인→라우팅)
│       │   ├── terms/page.tsx      # 약관 동의 (OAuth 후, 이용약관 + 개인정보 수집 동의)
│       │   ├── login/page.tsx      # OAuth 로그인 (Google, Kakao, Apple 버튼)
│       │   └── nickname/page.tsx   # 닉네임 설정 (한글 1~5자)
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
│   ├── anonId.ts               # HMAC-SHA256 익명 ID 계산 (Web Crypto API)
│   ├── utils.ts                # cn() 유틸 (clsx + tailwind-merge, shadcn 자동 생성)
│   └── types.ts                # 타입 정의 + 유틸 함수
├── hooks/
│   ├── useAuth.tsx             # AuthProvider Context + useAuth 훅 (OAuth, anonId, isAdmin, withdrawUser)
│   └── useCategories.tsx       # 카테고리 Context + useCategories 훅
├── components/
│   ├── ThemeProvider.tsx        # next-themes 래퍼 (attribute="class", defaultTheme="system")
│   ├── Header.tsx              # 상단 네비게이션 (shadcn DropdownMenu, Avatar, Button)
│   ├── PostCard.tsx            # 게시글 카드 (카테고리 배지, 미리보기, 조회수/좋아요/이미지수)
│   ├── ImageUploader.tsx       # 이미지 첨부 컴포넌트 (최대 5장, 썸네일 그리드, 삭제)
│   ├── CategoryFilter.tsx      # 카테고리 필터 드롭다운 (커스텀, 외부클릭 닫힘)
│   ├── CommentItem.tsx         # 댓글 (1단계 대댓글, 삭제/신고/차단)
│   ├── CommentInput.tsx        # 댓글 입력 바 (답글 대상 표시)
│   ├── ReportDialog.tsx        # 신고 다이얼로그 (shadcn Dialog, RadioGroup)
│   └── ui/                     # shadcn/ui 컴포넌트 (자동 생성)
│       ├── button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx, input.tsx,
│       │   label.tsx, textarea.tsx, select.tsx, badge.tsx, avatar.tsx,
│       │   tabs.tsx, separator.tsx, checkbox.tsx, radio-group.tsx,
│       │   sonner.tsx, sheet.tsx, scroll-area.tsx, skeleton.tsx, alert-dialog.tsx
│       └── ...
└── components.json             # shadcn/ui 설정 (style: new-york, cssVariables: true)
```

## 구현된 기능

### ✅ 완료
- [x] OAuth 인증 (Google, Kakao, Apple — Supabase PKCE 흐름)
- [x] 사용자 익명성 보장 (HMAC-SHA256 결정적 해시 anon_id, DB에 매핑 테이블 없음)
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
- [x] 약관 동의 (OAuth 후 첫 단계 — 이용약관 + 개인정보 수집 동의, 동의 시각 DB 저장)
- [x] 닉네임 조건 안내 (한글 1~5자, 중복 확인)
- [x] 회원 탈퇴 (Soft Delete — deleted_at 기록, 이메일 해시 보존, 탈퇴 계정 로그인 차단)
- [x] 다크모드 (next-themes, 시스템/라이트/다크 전환)

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
profiles       - id(=HMAC해시 anon_id), nickname, is_admin(boolean), terms_agreed_at(TIMESTAMPTZ),
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

-- 익명성 보장: 결정적 해시 anon_id (매핑 테이블 없음)
-- anon_id = HMAC-SHA256(email, ANON_SALT)의 앞 32자를 UUID 형식으로 변환
-- salt는 환경변수에만 존재 → DB만으로는 이메일 ↔ anon_id 연결 불가
-- get_anon_id() 함수: RLS 정책에서 사용
CREATE OR REPLACE FUNCTION get_anon_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (
    substring(encode(hmac(lower(auth.email()), current_setting('app.anon_salt'), 'sha256'), 'hex') from 1 for 8) || '-' ||
    substring(encode(hmac(lower(auth.email()), current_setting('app.anon_salt'), 'sha256'), 'hex') from 9 for 4) || '-' ||
    substring(encode(hmac(lower(auth.email()), current_setting('app.anon_salt'), 'sha256'), 'hex') from 13 for 4) || '-' ||
    substring(encode(hmac(lower(auth.email()), current_setting('app.anon_salt'), 'sha256'), 'hex') from 17 for 4) || '-' ||
    substring(encode(hmac(lower(auth.email()), current_setting('app.anon_salt'), 'sha256'), 'hex') from 21 for 12)
  )::UUID;
$$;
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
NEXT_PUBLIC_ANON_SALT=     # anon_id 생성용 HMAC salt (64자 hex, DB에 저장하지 않음)
```

## 이미지 업로드 구조

- **API Route**: `POST /api/upload` — Supabase JWT 인증 후 R2에 업로드
- **파일 제한**: 최대 5MB, JPG/PNG/GIF/WebP 허용
- **변환**: JPG/PNG/WebP → WebP (quality 85, 최대 너비 2000px), GIF는 원본 유지
- **파일 경로**: `posts/{anonId}/{timestamp}-{randomId}.{ext}`
- **sharp**: `optionalDependencies` + 동적 import (`await import('sharp')`) — Vercel 호환
- **R2 Lifecycle Rule**: 180일 후 자동 삭제 (prefix: `posts/`)

## OAuth 인증 흐름

```
/auth/login (Google/Kakao/Apple 버튼)
  → OAuth 제공자 로그인
  → /auth/callback (세션 확인 + anonId 계산)
  → profiles 조회 (anonId = HMAC-SHA256(email, salt))
  → 약관 미동의 → /auth/terms → /auth/nickname → /board
  → 닉네임 미설정 → /auth/nickname → /board
  → 기존 사용자 → /board
```

- 닉네임 조건: 한글 1~5자 (`/^[가-힣]{1,5}$/`)
- 이메일 도메인 제한 없음 (어떤 계정이든 가입 가능)

## 회원 탈퇴 (Soft Delete)

- **탈퇴 처리**: `profiles.deleted_at = now()`, `nickname = '탈퇴한사용자'`, `withdrawn_email_hash = SHA-256(email)`
- **로그인 차단**: OAuth 로그인 후 `deleted_at` 확인 → 탈퇴 계정이면 즉시 로그아웃 + 에러
- **게시글**: 삭제되지 않고 "탈퇴한 사용자"로 표시
- **실제 파기**: 6개월 후 관리자가 Supabase 대시보드에서 수동 삭제 (auth.users + profiles)
- **진입**: 헤더 드롭다운 → "회원 탈퇴" → `/settings/withdraw`

## 관리자 시스템

### 관리자 지정
```sql
-- get_anon_id()를 직접 사용하거나, 관리자 이메일의 해시를 수동으로 지정
-- Supabase SQL Editor에서 로그인 상태로 실행:
UPDATE profiles SET is_admin = true WHERE id = get_anon_id();
```

### 관리자 RLS 정책 (get_anon_id() 사용)
```sql
CREATE POLICY "Admin can delete any post" ON posts FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = get_anon_id() AND is_admin = true));

CREATE POLICY "Admin can delete any comment" ON comments FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = get_anon_id() AND is_admin = true));

CREATE POLICY "Admin can update any comment" ON comments FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = get_anon_id() AND is_admin = true));

CREATE POLICY "Admin can delete any profile" ON profiles FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = get_anon_id() AND is_admin = true));
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

### 인증 상태 관리 (결정적 해시 익명 ID)
```typescript
// AuthProvider가 onAuthStateChange 구독
// HMAC-SHA256(email, salt)로 anon_id를 결정적 생성 (매핑 테이블 없음)
const { user, anonId, nickname, isAdmin, signInWithOAuth, signOut, withdrawUser } = useAuth()
// user.id = auth.users.id (인증용), anonId = 데이터 테이블 참조용
// DB에 이메일↔anon_id 매핑 정보가 없으므로 완전한 익명성 보장
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
- Vercel 환경 변수에 R2 관련 키 5개 + ANON_SALT 등록 필요

### Route Group 구조
- `(site)/` — Header + `max-w-4xl` 래퍼가 필요한 모든 페이지 (board, auth, admin, settings)
- 루트 레이아웃은 Provider만 감싸고 Header 없음 → 랜딩페이지가 독립적인 레이아웃 사용 가능
- URL은 Route Group 괄호 이름에 영향받지 않음 (`/board`, `/auth/login` 등 그대로)

### 다크모드
- next-themes 사용 (attribute="class", defaultTheme="system")
- shadcn CSS 변수가 `:root`와 `.dark`에서 자동 전환
- `suppressHydrationWarning`을 `<html>` 태그에 추가 (hydration 불일치 방지)

## Supabase 설정 (수동 실행 필요)

### OAuth 프로바이더 활성화
Supabase 대시보드 → Authentication → Providers:
- **Google**: Client ID + Secret (Google Cloud Console)
- **Kakao**: REST API Key (Kakao Developers)
- **Apple**: Service ID + Secret Key (Apple Developer)
- Redirect URL: Supabase 기본 callback URL 사용

### DB 설정
```sql
-- pgcrypto 확장 활성화
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- anon_salt 설정 (NEXT_PUBLIC_ANON_SALT과 동일한 값)
ALTER DATABASE postgres SET app.anon_salt = '<salt값>';

-- get_anon_id() 함수 생성 (위 스키마 참조)
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

- **DiaCalendar** (Android 앱): `~/Documents/Android Project/DiaCalendar/`
  - 동일한 Supabase 백엔드 공유
  - 앱의 게시판 코드: `presentation/board/`, `data/remote/api/SupabaseBoardApi.kt`
