# 🏷 시책 어드민 — 개발 핸드오프 (Claude Code용)

> Cowork에서 UI 목업 + Vercel 배포 + Supabase DB 준비까지 완료.
> 여기부터 Claude Code가 앱 ↔ DB 연동을 이어서 구현. 새 세션 시작 시 이 파일 먼저 읽기.

## 현재 상태 (2026-07-21)
- **repo**: https://github.com/maven-wav/incentive-admin (Vercel 배포됨)
- **스택**: Next.js 14 (App Router) + Tailwind + JavaScript
- **데이터**: 지금은 in-memory 목데이터(`lib/mockData.js`) — 새로고침 시 초기화.
  → **다음 작업: 이걸 Supabase 쿼리로 교체** (증빙 등록→조회가 실제로 저장되게).
- **Supabase DB**: 준비 완료 (아래). 이건 목업용 백엔드이고, 실제 운영은 나중에 사내 DB로 교체 예정.

## 로컬 미푸시 변경 (있으면 먼저 커밋+push → 배포 반영)
- `components/Shell.js` (PC 풀와이드)
- `lib/mockData.js` (F&B 가맹점 17개)
- `HANDOFF.md`

## Supabase 연결
- **프로젝트**: dalmuti (기존 프로젝트에 스키마 분리, Free 플랜 · 월 $0)
- **스키마**: `incentive_admin` (public 아님)
- ⚠️ **대시보드 1회 설정 필요**: dalmuti → `Settings → API → Exposed schemas`에 `incentive_admin` 추가.
  (안 하면 JS 클라이언트가 이 스키마를 못 읽음)
- **env** (`.env.local` + Vercel 환경변수 — repo 커밋 금지, `.env*` gitignore):
  - `NEXT_PUBLIC_SUPABASE_URL=https://hvanvcjmnbalgghdiopn.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key — Cowork 채팅/대시보드 참고>`
- **클라이언트**: 스키마를 지정해야 함
  ```js
  import { createClient } from '@supabase/supabase-js'
  export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { db: { schema: 'incentive_admin' } }
  )
  ```

## 테이블 (dalmuti / incentive_admin) — 이미 생성 + 시드됨
`alliances` / `agencies` / `merchants` / `merchant_edit_history` / `incentive_claims` / `claim_status_history`
- enum: `merchant_status`, `claim_status`, `claim_type`
- 시드: 얼라이언스 3 · 대리점 3 · 가맹점 17 · 시책 11
- RLS: 목업 단계라 `demo_all`(anon/authenticated 전체 허용). 실제 Auth 붙일 때 역할별 정책으로 교체.

## 작업 체크리스트
- [ ] `lib/supabase.js` 클라이언트 (schema: incentive_admin)
- [ ] `lib/store.js` → Supabase 쿼리로 교체 (Context 구조는 유지, 데이터소스만 스왑)
- [ ] 상태 되돌리기 버튼 + `claim_status_history` 기록 (지급확정 건은 잠금)
- [ ] (선택) Supabase Auth + 역할 → 역할 스위처를 실제 로그인으로
- [ ] 홍보물부착 사진 실제 업로드 (Storage)

## 상태 되돌리기(undo) 설계
- 상태 변경은 항상 `claim_status_history`에 기록(누가·언제·왜).
- 어드민에 "승인 취소 → 검수대기" 버튼(내부 전용). 지급확정 건은 사유+권한 있을 때만 해제.
- → Supabase 콘솔 직접 수정 없이 어드민 UI에서 안전하게 되돌림.

## ⚠️ 임시값 (실정책으로 교체)
- 시책 단가: 가맹모집 30,000 / 홍보물부착 20,000 (`lib/mockData.js`)
- 결제검수 기준: 등록월 포함 최근 3개월, 각 월 3건 이상 = Y (`TXN_CRITERIA`)
