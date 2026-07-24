// ────────────────────────────────────────────────────────────────
// 콰트로 API 어댑터 (가맹/비가맹 결제 서빙 플랫폼)
// 노션 아키텍처 메모대로 인터페이스로 추상화 → Mock ↔ 실연동 스위치.
// 실연동 시 QUATRO_SOURCE=real 로 바꾸고 realVerify 구현만 채우면 됨.
// ────────────────────────────────────────────────────────────────
import { TXN_TOTAL_CRITERIA, isGamaeng } from "./mockData";

const QUATRO_SOURCE = "mock"; // "mock" | "real"

// 결제검수(시책유형 '가맹모집'에만 적용) = 가맹여부 · 활성화 · 3개월 총 결제건수
//
// - 가맹(가맹선불·가맹후불·PG선불): 카카오페이 가맹심사 완료 여부로 활성화 Y/N 판정,
//   총 결제건수도 조회 가능. (2026-07-24 R2 전제 P1: PG선불도 가맹으로 통일)
// - 비가맹(비가맹선불·비가맹후불): 내부에서 확인이 불가능하므로
//   활성화는 항상 N, 결제건수는 '확인불가'로 두고 관리자가 수동 판단한다.
//
// auto=true 인 건만 '자동충족'으로 표시되고 승인 버튼이 열린다.
export function verifyPayment({ recruitType, isActive, txnTotal }) {
  if (!isGamaeng(recruitType)) {
    return { gamaeng: false, active: false, txnTotal: null, auto: false, criteria: TXN_TOTAL_CRITERIA };
  }
  const active = !!isActive;
  const total = txnTotal ?? 0;
  return {
    gamaeng: true,
    active,
    txnTotal: total,
    auto: active && total >= TXN_TOTAL_CRITERIA,
    criteria: TXN_TOTAL_CRITERIA,
  };
}

// 실연동 자리 (현재 미사용)
async function realVerify(/* cid, month */) {
  throw new Error("콰트로 실연동 미구현 — QUATRO_SOURCE=mock 사용 중");
}

export const quatro = { source: QUATRO_SOURCE, verifyPayment, realVerify };
