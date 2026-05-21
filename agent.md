# 캐릭터 문단 배틀 작업 가이드

## 프로젝트 개요
- 초등학교 3학년 국어 문단 쓰기 활동을 위한 React 앱입니다.
- 학생은 로그인 없이 학생 번호만 사용합니다.
- 데이터는 localStorage가 아니라 Cloud Firestore에 저장합니다.
- 사이트 배포는 Vercel을 기준으로 합니다.
- Firebase CLI는 Firestore 규칙과 색인 배포에만 사용합니다.
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
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## 주요 구조
- `src/components`: 화면과 공통 UI 컴포넌트
- `src/services`: Firestore CRUD와 Gemini REST 호출
- `src/utils`: 문장 생성, 검증, 규칙 기반 배틀 판정
- `src/data/situations.ts`: 배틀 상황 카드
- `firestore.rules`: Firestore 보안 규칙
- `firestore.indexes.json`: Firestore 색인
- `firebase.json`: Firestore 규칙/색인 배포 설정

## 배포
Firestore 규칙/색인을 바꾼 경우:

```bash
npx firebase deploy --only firestore
```

사이트 배포는 Vercel에서 처리합니다.

Vercel 설정:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## 운영 보안 메모
현재 Firestore 규칙은 로그인 없이 수업에서 바로 쓰는 MVP 기준으로 열려 있습니다.
실제 운영 범위가 커지면 학생 코드, 교사용 관리자 인증, 수정 권한 제한을 추가해야 합니다.

`VITE_GEMINI_API_KEY`는 브라우저 번들에서 노출될 수 있습니다. 공개 운영에서 키 보호가 필요하면 서버 프록시가 필요합니다.
