// ────────────────────────────────────────────────────────────────
// 프로토타입용 목데이터
// 실제 DB(Supabase) 연동 시 이 구조를 테이블로 옮기면 됨.
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

// ── 얼라이언스사 (POS/VAN 상위 파트너) ─────────────────────────
export const alliances = [
  { id: "AL01", name: "오케이포스" },
  { id: "AL02", name: "KICC" },
  { id: "AL03", name: "이지포스" },
];

// ── VAN 대리점 (각 얼라이언스 소속) ─────────────────────────────
export const agencies = [
  { id: "AG01", name: "승리정보통신", allianceId: "AL01", bankAccount: "카카오뱅크 3333-01-1234567" },
  { id: "AG02", name: "현페이먼트", allianceId: "AL02", bankAccount: "국민 123-45-67890" },
  { id: "AG03", name: "대한페이", allianceId: "AL03", bankAccount: "신한 110-222-333444" },
];

// ── 가맹점 ────────────────────────────────────────────────────
export const merchants = [
  {
    id: "M1001", name: "쇼지", bizNo: "868-11-02813", cid: "CQP05FGZM6SCRX6",
    storeType: "일반가맹점", prepaidType: "가맹선불", agencyId: "AG01",
    registeredAt: "2026-06-12", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1002", name: "오가닭", bizNo: "259-12-00793", cid: "CQR00W8AYWXQLV",
    storeType: "프랜차이즈", prepaidType: "가맹후불", agencyId: "AG02",
    registeredAt: "2026-06-12", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1003", name: "행복분식 강남점", bizNo: "123-45-67890", cid: "CQP11K3ND8ZZ01",
    storeType: "일반가맹점", prepaidType: "비가맹선불", agencyId: "AG01",
    registeredAt: "2026-05-20", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1004", name: "청춘커피 로스터리", bizNo: "234-56-78901", cid: "",
    storeType: "일반가맹점", prepaidType: "PG선불", agencyId: "AG03",
    registeredAt: "2026-06-28", status: MERCHANT_STATUS.PENDING, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1005", name: "미래김밥 판교점", bizNo: "567-89-01234", cid: "CQP77M2LP0OI55",
    storeType: "프랜차이즈", prepaidType: "가맹선불", agencyId: "AG02",
    registeredAt: "2026-06-25", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1006", name: "든든국밥 서초", bizNo: "789-01-23456", cid: "",
    storeType: "일반가맹점", prepaidType: "비가맹후불", agencyId: "AG03",
    registeredAt: "2026-07-02", status: MERCHANT_STATUS.PENDING, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1007", name: "우리동네호프", bizNo: "678-90-12345", cid: "CQR88N1QW9PL22",
    storeType: "일반가맹점", prepaidType: "가맹후불", agencyId: "AG01",
    registeredAt: "2026-06-02", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1008", name: "명동칼국수 명동점", bizNo: "111-22-33445", cid: "CQP20AB12CD34",
    storeType: "일반가맹점", prepaidType: "가맹선불", agencyId: "AG02",
    registeredAt: "2026-06-05", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1009", name: "오라이족발 건대점", bizNo: "222-33-44556", cid: "CQR31EF56GH78",
    storeType: "프랜차이즈", prepaidType: "가맹후불", agencyId: "AG03",
    registeredAt: "2026-06-18", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1010", name: "바삭치킨 잠실점", bizNo: "333-44-55667", cid: "CQP42IJ90KL12",
    storeType: "프랜차이즈", prepaidType: "가맹선불", agencyId: "AG01",
    registeredAt: "2026-06-30", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1011", name: "그린샐러드 삼성점", bizNo: "444-55-66778", cid: "",
    storeType: "일반가맹점", prepaidType: "PG선불", agencyId: "AG02",
    registeredAt: "2026-07-03", status: MERCHANT_STATUS.PENDING, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1012", name: "소문난떡볶이 노원점", bizNo: "555-66-77889", cid: "CQR53MN34OP56",
    storeType: "일반가맹점", prepaidType: "비가맹선불", agencyId: "AG01",
    registeredAt: "2026-05-28", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1013", name: "하루베이커리 연남점", bizNo: "666-77-88990", cid: "CQP64QR78ST90",
    storeType: "일반가맹점", prepaidType: "가맹후불", agencyId: "AG03",
    registeredAt: "2026-06-22", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1014", name: "정성곱창 왕십리점", bizNo: "777-88-99001", cid: "",
    storeType: "일반가맹점", prepaidType: "비가맹후불", agencyId: "AG02",
    registeredAt: "2026-07-05", status: MERCHANT_STATUS.PENDING, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1015", name: "화통마라탕 강남점", bizNo: "888-99-00112", cid: "CQR75UV12WX34",
    storeType: "프랜차이즈", prepaidType: "가맹선불", agencyId: "AG01",
    registeredAt: "2026-06-10", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1016", name: "진국순대국 사당점", bizNo: "999-00-11223", cid: "CQP86YZ56AB78",
    storeType: "일반가맹점", prepaidType: "가맹후불", agencyId: "AG03",
    registeredAt: "2026-06-15", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
  {
    id: "M1017", name: "달콤디저트 가로수길점", bizNo: "100-11-22334", cid: "CQR97CD90EF12",
    storeType: "프랜차이즈", prepaidType: "가맹선불", agencyId: "AG02",
    registeredAt: "2026-07-01", status: MERCHANT_STATUS.APPROVED, lastEditedBy: null, editHistory: [],
  },
];

// ── 시책 요청 (증빙 등록건) ────────────────────────────────────
// txnCounts: 콰트로 Mock이 반환하는 등록월 포함 최근 3개월 결제건수
// proofPhoto: 홍보물부착 유형의 부착 사진 증빙(프로토타입은 placeholder)
export const claims = [
  {
    id: "C2001", merchantId: "M1001", agencyId: "AG01", type: "가맹모집", claimMonth: "2026-06",
    status: CLAIM_STATUS.REVIEW, txnCounts: [5, 4, 6], proofPhoto: null,
    reviewedBy: null, confirmedMonth: null, amount: 30000,
  },
  {
    id: "C2002", merchantId: "M1002", agencyId: "AG02", type: "가맹모집", claimMonth: "2026-06",
    status: CLAIM_STATUS.REVIEW, txnCounts: [3, 3, 0], proofPhoto: null,
    reviewedBy: null, confirmedMonth: null, amount: 30000,
  },
  {
    id: "C2003", merchantId: "M1003", agencyId: "AG01", type: "홍보물부착", claimMonth: "2026-06",
    status: CLAIM_STATUS.WAIT, txnCounts: null, proofPhoto: "부착사진_행복분식.jpg",
    reviewedBy: "내부담당자", confirmedMonth: null, amount: 20000,
  },
  {
    id: "C2004", merchantId: "M1005", agencyId: "AG02", type: "가맹모집", claimMonth: "2026-06",
    status: CLAIM_STATUS.PAID, txnCounts: [8, 7, 9], proofPhoto: null,
    reviewedBy: "내부담당자", confirmedMonth: "2026-07", amount: 30000,
  },
  {
    id: "C2005", merchantId: "M1007", agencyId: "AG01", type: "홍보물부착", claimMonth: "2026-06",
    status: CLAIM_STATUS.PAID, txnCounts: null, proofPhoto: "부착사진_호프.jpg",
    reviewedBy: "내부담당자", confirmedMonth: "2026-07", amount: 20000,
  },
  {
    id: "C2006", merchantId: "M1008", agencyId: "AG02", type: "가맹모집", claimMonth: "2026-06",
    status: CLAIM_STATUS.REVIEW, txnCounts: [4, 5, 3], proofPhoto: null,
    reviewedBy: null, confirmedMonth: null, amount: 30000,
  },
  {
    id: "C2007", merchantId: "M1010", agencyId: "AG01", type: "홍보물부착", claimMonth: "2026-06",
    status: CLAIM_STATUS.REVIEW, txnCounts: null, proofPhoto: "부착사진_바삭치킨.jpg",
    reviewedBy: null, confirmedMonth: null, amount: 20000,
  },
  {
    id: "C2008", merchantId: "M1012", agencyId: "AG01", type: "가맹모집", claimMonth: "2026-06",
    status: CLAIM_STATUS.WAIT, txnCounts: [6, 5, 7], proofPhoto: null,
    reviewedBy: "내부담당자", confirmedMonth: null, amount: 30000,
  },
  {
    id: "C2009", merchantId: "M1013", agencyId: "AG03", type: "홍보물부착", claimMonth: "2026-06",
    status: CLAIM_STATUS.WAIT, txnCounts: null, proofPhoto: "부착사진_하루베이커리.jpg",
    reviewedBy: "내부담당자", confirmedMonth: null, amount: 20000,
  },
  {
    id: "C2010", merchantId: "M1015", agencyId: "AG01", type: "가맹모집", claimMonth: "2026-05",
    status: CLAIM_STATUS.PAID, txnCounts: [9, 8, 10], proofPhoto: null,
    reviewedBy: "내부담당자", confirmedMonth: "2026-07", amount: 30000,
  },
  {
    id: "C2011", merchantId: "M1016", agencyId: "AG03", type: "가맹모집", claimMonth: "2026-06",
    status: CLAIM_STATUS.REVIEW, txnCounts: [2, 4, 3], proofPhoto: null,
    reviewedBy: null, confirmedMonth: null, amount: 30000,
  },
];
