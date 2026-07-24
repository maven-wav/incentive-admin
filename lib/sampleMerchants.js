// 테스트 어드민용 샘플 가맹 참조 풀 — 실제 콰트로/내부DB 조회를 대체하는 목데이터.
// 하나의 사업자번호에 CID가 여러 개일 수 있다(N:1). CID↔가맹점명은 1:1.
export const SAMPLE_MERCHANTS = [
  { bizNo: "214-88-01579", stores: [
    { cid: "CQP7H2CHK9N01", name: "행운치킨 역삼점" },        // 치킨집
    { cid: "CQP7H2BNS9N02", name: "김이분식 역삼점" },        // 분식집
    { cid: "CQP7H2ICE9N03", name: "얼음창고 무인아이스크림 역삼점" }, // 무인아이스크림
  ]},
  { bizNo: "305-19-77820", stores: [
    { cid: "CQR3M8CAF1P10", name: "온기카페 성수점" },
  ]},
  { bizNo: "411-30-55214", stores: [
    { cid: "CQP5B1HNW2Q21", name: "청담한우 본점" },
    { cid: "CQP5B1HNW2Q22", name: "청담한우 딜리버리" },
  ]},
  { bizNo: "502-77-31648", stores: [
    { cid: "CQR9P4PIZ7R30", name: "바로피자 마포점" },
  ]},
];

// 사업자번호(하이픈 유무 무관) → stores 목록
export const lookupByBizNo = (bizNo) => {
  const norm = String(bizNo || "").replace(/\D/g, "");
  if (norm.length < 10) return [];
  const hit = SAMPLE_MERCHANTS.find((s) => s.bizNo.replace(/\D/g, "") === norm);
  return hit ? hit.stores : [];
};
