// CID 형식 검사 유틸 — 노션 Pain Point: CID 수기 입력 오류, 0↔O 혼동
// 반환: { ok, warning }
export function inspectCid(cid) {
  if (!cid) return { ok: true, warning: null }; // 선택 입력
  const value = cid.trim();
  if (!/^[A-Za-z0-9]+$/.test(value)) {
    return { ok: false, warning: "CID는 영문·숫자 조합만 가능합니다." };
  }
  const hasZero = value.includes("0");
  const hasO = /O/.test(value);
  if (hasZero && hasO) {
    return {
      ok: true,
      warning: "숫자 0과 영문 O가 함께 있습니다 — 혼동 여부를 확인하세요.",
    };
  }
  if (value.length < 10) {
    return { ok: true, warning: "CID 길이가 짧습니다 — 오타 여부를 확인하세요." };
  }
  return { ok: true, warning: null };
}
