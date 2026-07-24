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
- ✅ **스키마 노출 완료** — dalmuti → `Settings → API → Exposed schemas`에
  `incentive_admin` 추가됨 (대시보드 설정이라 영구 유지).
  이게 없으면 JS 클라이언트가 `PGRST106 Invalid schema`로 전부 실패한다.
- 참고: 노출 설정을 SQL로 바꿀 일이 생기면 캐시 갱신까지 해야 한다 (안 하면 `PGRST205`).
  단, 아래는 대시보드 저장 시 덮어써지므로 임시 수단으로만 쓸 것.
  ```sql
  ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, incentive_admin';
  NOTIFY pgrst, 'reload schema';
  ```
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

## ⚠️ 용어 (헷갈리기 쉬움)
- **모집유형** = `merchants.prepaid_type` (가맹선불/비가맹선불/가맹후불/비가맹후불/PG선불).
  화면 라벨만 '모집유형'이고 **DB 컬럼명은 `prepaid_type` 그대로**다. 코드 상수는 `RECRUIT_TYPES`.
- **시책 유형** = `incentive_claims.type` (가맹모집/홍보물부착). 위와 **완전히 별개 필드**다.
- 상태값·모집유형 값은 전부 DB enum/문자열이라 **값 자체를 바꾸려면 마이그레이션**이 필요하다.

## 데이터 모델 — 얼라이언스와 대리점은 독립
- `merchants`에 `alliance_id`·`agency_id`가 **각각 독립 컬럼**으로 있다.
  (예전처럼 대리점에서 얼라이언스를 파생하지 않는다.)
- **VAN 대리점은 공용 풀(28개).** 같은 대리점을 여러 얼라이언스가 쓸 수 있다.
  실제로 (주)그린페이는 3사, (주)다온시스템·현페이먼트는 2사가 공유 중.
- **역할 스코핑은 `merchant.agency_id` 기준** (2026-07-24 변경: 로그인 주체가 VAN 대리점으로 전환됨).
  이전엔 얼라이언스가 로그인 주체라 `alliance_id`로 스코핑했으나, 대리점 외부 접속 구조로 뒤집었다.
  얼라이언스는 이제 등록 시 폼에서 선택하는 값이다. 시책의 얼라이언스는 여전히 가맹점에서 따라온다.
- 그래서 **정산 묶음은 대리점 단위로만** 만든다 (지급이 대리점 계좌로 나가고,
  공용 대리점은 얼라이언스가 단일값이 아니라서).

## 테이블 (dalmuti / incentive_admin) — 이미 생성 + 시드됨
`alliances` / `agencies` / `merchants` / `merchant_edit_history` / `incentive_claims` / `claim_status_history`
- enum: `merchant_status`, `claim_status`, `claim_type`
- 시드: 얼라이언스 3(오케이포스·유니온소프트·이지포스) · 대리점 28 · 가맹점 17 · 시책 11
- `incentive_claims.is_active`(활성화) + `txn_total`(3개월 총 결제건수) — 결제검수용
- 제거된 컬럼: `agencies.alliance_id`(공용 풀과 충돌), `incentive_claims.txn_counts`(→ `txn_total`)
- RLS: 목업 단계라 `demo_all`(anon/authenticated 전체 허용). 실제 Auth 붙일 때 역할별 정책으로 교체.

## 결제검수 (시책유형 '가맹모집'에만 적용) — `lib/quatro.js`
3요소로 판정한다:
1. **가맹 여부** — 가맹선불·가맹후불만 '가맹'. 나머지는 비가맹.
2. **활성화(Y/N)** — 가맹은 카카오페이 가맹심사 완료 여부. **비가맹은 내부 확인 불가라 항상 N.**
3. **3개월 총 결제건수** — 가맹은 숫자, 비가맹은 '확인불가'(null).

→ 가맹 AND 활성화 Y AND 총 결제 ≥ `TXN_TOTAL_CRITERIA` 이면 **'자동충족'** 배지.
   비가맹·미충족은 **'수동판단'** 배지가 붙고 관리자가 직접 승인/반려한다.

## 작업 체크리스트
- [x] `lib/supabase.js` 클라이언트 (schema: incentive_admin)
- [x] `lib/store.js` → Supabase 쿼리로 교체 (Context 구조는 유지, 데이터소스만 스왑)
      - snake_case↔camelCase 매퍼를 store 내부에 둬서 페이지 코드는 무변경
      - 액션은 async → DB write 후 응답 row로 state 갱신 (refetch 레이스 없음)
      - `mockData.js`는 상수(enum·단가·기준값)만 남기고 시드 배열 제거
- [x] 상태 되돌리기 버튼 + `claim_status_history` 기록 (지급확정 건은 잠금)
- [x] 얼라이언스↔대리점 독립화 + VAN 대리점 공용 풀 28개(+AG29 신신엠엔씨 = 29개)
- [x] ~~역할 스위처에서 VAN대리점 페르소나 제거 (내부 + 얼라이언스 3사)~~
      → **2026-07-24 뒤집음**: 로그인 주체를 VAN 대리점으로 전환. 역할 스위처 = 내부 + 대리점 5곳
      (신신엠엔씨·그린페이·다온시스템·현페이먼트·케이에스넷트웍스), 스코핑 `agency_id` 기준.
- [x] '선/후불' → '모집유형' 라벨 변경 (값·DB컬럼은 그대로)
- [x] 결제검수 재설계 (활성화 · 총 결제건수 · 자동충족/수동판단)
- [x] 가맹점 승인 되돌리기 (승인완료 → 등록대기, 사유 + `merchant_edit_history`)
- [x] 홍보물부착 사진 실제 업로드 (Storage · 클릭 + 드래그앤드롭)
- [ ] (선택) Supabase Auth + 역할 → 역할 스위처를 실제 로그인으로
- [ ] (선택) 상태 이력을 검수 화면에 노출 (데이터는 이미 쌓이는 중)

## 부착 사진 (Supabase Storage)
- 버킷 **`proofs`** (public) · 정책 `proofs_demo_read`(SELECT/anon) + `proofs_demo_insert`(INSERT/anon)
- `lib/supabase.js` 의 `uploadProof(file)` → 저장 경로 반환 → `incentive_claims.proof_photo` 에 저장.
  표시는 `proofPublicUrl(path)`.
- ⚠️ **Storage는 키에 한글 등 비ASCII를 넣으면 `InvalidKey`로 거부한다.**
  그래서 `storageKeyFor()`가 확장자를 분리하고 파일명을 ASCII로 정리한다.
  (`스크린샷 2026-07-22 오후 1.32.05.png` → `<타임스탬프>_2026-07-22_1.32.05.png`)
- ⚠️ **초기 시드의 `proof_photo`는 실제 파일이 없는 파일명 문자열**('부착사진_○○.jpg')이라
  공개 URL이 404다. 검수 모달의 `ProofImage`가 `onError`로 안내 화면을 대신 띄운다.
- ⚠️ **anon에 DELETE 정책이 없다.** '제거'는 로컬 상태만 비우므로 올렸다 제거한 파일은
  버킷에 그대로 남는다(고아 파일). 정리하려면 DELETE 정책 추가 + 제거 시 삭제 호출 필요.

## 상태 되돌리기(undo) 설계
- 상태 변경은 항상 `claim_status_history`에 기록(누가·언제·왜).
- 어드민에 "승인 취소 → 검수대기" 버튼(내부 전용). 지급확정 건은 사유+권한 있을 때만 해제.
- → Supabase 콘솔 직접 수정 없이 어드민 UI에서 안전하게 되돌림.

## ⚠️ 임시값 (실정책으로 교체)
- 시책 단가: 가맹모집 30,000 / 홍보물부착 20,000 (`lib/mockData.js`)
- 결제검수 기준: 3개월 **총** 결제 4건 이상 (`TXN_TOTAL_CRITERIA`)
- **PG선불을 비가맹으로 분류** (`isGamaeng()` — `lib/mockData.js`). 실제 정책 확인 필요.
- 대리점 28곳 계좌번호는 전부 placeholder


---

## 🔔 2026-07-24 리뷰 수정 (먼저 볼 것)
> Cowork 리뷰 후 나온 수정사항 4건은 **`HANDOFF_리뷰수정_2026-07-24.md`** 에 정리됨.
> ① 로그인 주체 대리점 전환(스코핑 agency_id) ② 모집유형 우선 선택+유형별 입력 분기 ③ CID:사업자번호 N:1 ④ 샘플 가맹점 올리기 모달.
> Supabase 대리점 1곳(AG29 신신엠엔씨) 추가 SQL 포함. 구현+배포 진행할 것.
