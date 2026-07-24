// ────────────────────────────────────────────────────────────────
// 도메인 상수 (enum · 코드값 · 정책값)
// 데이터 자체는 Supabase(incentive_admin 스키마)에서 읽어온다 — lib/store.js
// 아래 상태값 문자열은 DB enum(merchant_status·claim_status·claim_type)과
// 정확히 일치해야 한다.
// 결제 검증은 lib/quatro.js 의 Mock 어댑터가 담당.
// ────────────────────────────────────────────────────────────────

// 모집유형 — 화면 라벨은 '모집유형'이지만 DB 컬럼은 prepaid_type 그대로다.
// 값 자체는 DB에 그대로 저장되므로 문자열을 바꾸려면 마이그레이션이 필요하다.
export const RECRUIT_TYPES = ["가맹선불", "비가맹선불", "가맹후불", "비가맹후불", "PG선불"];

// 카카오페이 가맹심사 대상인 유형만 '가맹'. 나머지는 비가맹으로 보고
// 내부에서 활성화·결제건수를 확인할 수 없다.
// ⚠️ 임시: PG선불은 비가맹으로 분류 (실제 정책 확인되면 교체)
const GAMAENG_TYPES = ["가맹선불", "가맹후불"];
export const isGamaeng = (recruitType) => GAMAENG_TYPES.includes(recruitType);

// 카카오페이 가맹 유형 — 사업자번호↔CID 자동조회 대상 (⚠️ 등록 폼 전용)
// 결제검수용 isGamaeng([가맹선불,가맹후불])과 다르다: 여기엔 PG선불이 포함된다.
export const KAKAOPAY_CID_TYPES = ["가맹선불", "가맹후불", "PG선불"];
export const hasCid = (recruitType) => KAKAOPAY_CID_TYPES.includes(recruitType);

// 가맹점 유형
export const STORE_TYPES = ["일반가맹점", "프랜차이즈"];

// 시책 유형 + 유형별 지급 단가(원) — ⚠️ 임시값. 실제 정책단가로 교체.
// '시책 유형'은 모집유형과 완전히 별개 필드다.
export const CLAIM_TYPES = {
  RECRUIT: "가맹모집",
  PROMO: "홍보물부착",
};
export const INCENTIVE_AMOUNT = {
  [CLAIM_TYPES.RECRUIT]: 30000,
  [CLAIM_TYPES.PROMO]: 20000,
};

// 가맹점 등록 상태
export const MERCHANT_STATUS = {
  PENDING: "등록대기",
  APPROVED: "승인완료",
  REJECTED: "반려",
};

// 시책 요청 상태 (요청 → 정산대기(승인) → 지급확정 / 반려)
export const CLAIM_STATUS = {
  REVIEW: "검수대기",
  WAIT: "정산대기",
  PAID: "지급확정",
  REJECTED: "반려",
};

// 결제검수 자동판정 기준: 3개월 총 결제건수 — ⚠️ 임시값
export const TXN_TOTAL_CRITERIA = 4;
