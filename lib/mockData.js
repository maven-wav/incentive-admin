// ────────────────────────────────────────────────────────────────
// 도메인 상수 (enum · 코드값 · 정책값)
// 데이터 자체는 Supabase(incentive_admin 스키마)에서 읽어온다 — lib/store.js
// 아래 상태값 문자열은 DB enum(merchant_status·claim_status·claim_type)과
// 정확히 일치해야 한다.
// 콰트로 결제 검증은 lib/quatro.js 의 Mock 어댑터가 담당.
// ────────────────────────────────────────────────────────────────

// 선/후불 구분 (파트너센터 캡처 기준)
export const PREPAID_TYPES = ["가맹선불", "비가맹선불", "가맹후불", "비가맹후불", "PG선불"];

// 가맹점 유형
export const STORE_TYPES = ["일반가맹점", "프랜차이즈"];

// 시책 유형 + 유형별 지급 단가(원) — ⚠️ 임시값. 실제 정책단가로 교체.
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

// 콰트로 결제검수 기준: 등록월 포함 최근 3개월, 각 월 결제 3건 이상 → Y
export const TXN_CRITERIA = 3;

