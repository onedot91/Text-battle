# Character Paragraph Battle 작업 가이드

## 프로젝트 개요
- 초등학교 3학년 국어 문단 쓰기 활동용 React 앱입니다.
- 학생은 로그인 없이 학생 번호로 캐릭터를 만들고 대표 캐릭터를 고릅니다.
- 데이터는 Supabase Postgres에 저장합니다.
- 사이트 배포는 Vercel 기준입니다.
- Gemini API 키는 Vercel 환경변수 `VITE_GEMINI_API_KEY`로 연결합니다.
- Gemini 호출 실패 시 `src/utils/battleEngine.ts`의 규칙 기반 결과로 진행합니다.

## 실행
```bash
npm install
npm run dev
```

개발 서버 기본 주소는 Vite 기본값인 `http://localhost:5173`입니다.

## 환경변수
로컬은 `.env.local`, Vercel은 Project Settings의 Environment Variables에 아래 값을 넣습니다.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## Supabase 설정
Supabase Dashboard의 SQL Editor에서 `supabase/schema.sql`을 실행해 테이블, 인덱스, RLS 정책을 만듭니다.

현재 정책은 수업용 MVP 기준으로 anon key에서 읽기/쓰기/수정/삭제를 모두 허용합니다. 실제 운영 범위가 커지면 학생 코드, 교사용 관리자 인증, 수정 권한 제한을 추가해야 합니다.

## 주요 구조
- `src/components`: 화면과 공통 UI 컴포넌트
- `src/services`: Supabase CRUD와 Gemini REST 호출
- `src/lib/supabase.ts`: Supabase 클라이언트와 테이블 타입
- `src/utils`: 문장 생성, 검증, 규칙 기반 배틀 판정
- `src/data/situations.ts`: 배틀 상황 카드
- `supabase/schema.sql`: Supabase 테이블/인덱스/RLS 정책

## 배포
Vercel 설정:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## 보안 메모
`VITE_SUPABASE_ANON_KEY`와 `VITE_GEMINI_API_KEY`는 브라우저 번들에 노출됩니다. Supabase anon key는 RLS 정책으로 권한을 제한하는 전제의 공개 키입니다. Gemini 키 보호가 필요하면 서버 프록시 또는 Edge Function으로 옮기는 것이 맞습니다.
