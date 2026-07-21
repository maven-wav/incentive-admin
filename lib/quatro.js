// ────────────────────────────────────────────────────────────────
// 콰트로 API 어댑터 (가맹/비가맹 결제 서빙 플랫폼)
// 노션 아키텍처 메모대로 인터페이스로 추상화 → Mock ↔ 실연동 스위치.
// 실연동 시 QUATRO_SOURCE=real 로 바꾸고 realVerify 구현만 채우면 됨.
// ────────────────────────────────────────────────────────────────
import { TXN_CRITERIA } from "./mockData";

const QUATRO_SOURCE = "mock"; // "mock" | "real"

// 결제검수: 등록월 포함 최근 3개월 각 월 결제건수가 모두 기준 이상이면 Y
export function verifyPayment(txnCounts) {
  if (!Array.isArray(txnCounts)) return { pass: false, counts: [], criteria: TXN_CRITERIA };
  const pass = txnCounts.every((c) => c >= TXN_CRITERIA);
  return { pass, counts: txnCounts, criteria: TXN_CRITERIA };
}

// 실연동 자리 (현재 미사용)
async function realVerify(/* cid, month */) {
  throw new Error("콰트로 실연동 미구현 — QUATRO_SOURCE=mock 사용 중");
}

export const quatro = { source: QUATRO_SOURCE, verifyPayment, realVerify };
