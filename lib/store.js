"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { MERCHANT_STATUS, CLAIM_STATUS, CLAIM_TYPES, INCENTIVE_AMOUNT, isGamaeng } from "./mockData";

const StoreContext = createContext(null);

// 데모용 전환 가능한 페르소나 (실제로는 Supabase Auth 로그인으로 대체)
// VAN 대리점은 공용 풀이라 로그인 주체가 아니다 → 내부 + 얼라이언스 3사만 노출.
export const PERSONAS = [
  { key: "internal", role: "내부", label: "내부 담당자 (카카오페이)", scopeId: null },
  { key: "al01", role: "얼라이언스사", label: "얼라이언스: 오케이포스", scopeId: "AL01" },
  { key: "al02", role: "얼라이언스사", label: "얼라이언스: 유니온소프트", scopeId: "AL02" },
  { key: "al03", role: "얼라이언스사", label: "얼라이언스: 이지포스", scopeId: "AL03" },
];

const today = () => new Date().toISOString().slice(0, 10);
const stamp = (ts) => String(ts).slice(0, 16).replace("T", " ");

// DB(snake_case) ↔ 앱(camelCase) 매핑. 이 레이어 덕분에 페이지 코드는 그대로 유지.
// merchants.prepaid_type 은 화면에서 '모집유형'으로 부르지만 컬럼명은 그대로다.
const toAgency = (r) => ({ id: r.id, name: r.name, bankAccount: r.bank_account });
const toEdit = (r) => ({ at: stamp(r.at), by: r.by_user, reason: r.reason, changes: r.changes });
const toMerchant = (r, history = []) => ({
  id: r.id,
  name: r.name,
  bizNo: r.biz_no,
  cid: r.cid || "",
  storeType: r.store_type,
  recruitType: r.prepaid_type,
  agencyId: r.agency_id,
  allianceId: r.alliance_id,
  registeredAt: r.registered_at,
  status: r.status,
  lastEditedBy: r.last_edited_by,
  editHistory: history,
});
const toClaim = (r) => ({
  id: r.id,
  merchantId: r.merchant_id,
  agencyId: r.agency_id,
  type: r.type,
  claimMonth: r.claim_month,
  status: r.status,
  isActive: r.is_active,
  txnTotal: r.txn_total,
  proofPhoto: r.proof_photo,
  reviewedBy: r.reviewed_by,
  confirmedMonth: r.confirmed_month,
  amount: r.amount,
});

// 기존 시드 ID 체계(M1001·C2001) 유지 — 로드된 행의 최대값 + 1
const nextIdFrom = (rows, prefix) => {
  const max = rows.reduce((acc, r) => {
    const n = parseInt(String(r.id).slice(prefix.length), 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `${prefix}${max + 1}`;
};

export function StoreProvider({ children }) {
  const [personaKey, setPersonaKey] = useState("internal");
  const [alliances, setAlliances] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);

  const persona = PERSONAS.find((p) => p.key === personaKey);

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  // DB 작업 실패는 조용히 넘기지 않고 토스트로 노출 (스키마 미노출·RLS 등)
  const fail = useCallback(
    (error, what) => {
      console.error(`[${what}]`, error);
      flash(`${what} 실패 — ${error.message}`);
    },
    [flash]
  );

  // ── 초기 로드 ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [al, ag, me, eh, cl] = await Promise.all([
        supabase.from("alliances").select("*").order("id"),
        supabase.from("agencies").select("*").order("id"),
        // id를 tie-breaker로 둔다 — 시드 데이터는 등록일/생성시각이 동일해서
        // 이것 없이는 새로고침할 때마다 행 순서가 뒤바뀐다.
        supabase.from("merchants").select("*").order("registered_at", { ascending: false }).order("id"),
        supabase.from("merchant_edit_history").select("*").order("at"),
        supabase.from("incentive_claims").select("*").order("created_at", { ascending: false }).order("id"),
      ]);

      const firstError = [al, ag, me, eh, cl].find((r) => r.error)?.error;
      if (firstError) {
        console.error("[초기 로드]", firstError);
        setLoadError(firstError.message);
        setLoading(false);
        return;
      }

      const historyBy = {};
      eh.data.forEach((r) => (historyBy[r.merchant_id] ||= []).push(toEdit(r)));

      setAlliances(al.data);
      setAgencies(ag.data.map(toAgency));
      setMerchants(me.data.map((r) => toMerchant(r, historyBy[r.id] || [])));
      setClaims(cl.data.map(toClaim));
      setLoading(false);
    })();
  }, []);

  const agencyById = useCallback((id) => agencies.find((a) => a.id === id), [agencies]);
  const allianceById = useCallback((id) => alliances.find((a) => a.id === id), [alliances]);
  const merchantById = useCallback((id) => merchants.find((m) => m.id === id), [merchants]);
  // 시책의 얼라이언스는 가맹점에서 따라온다 (대리점과 무관)
  const allianceOfClaim = useCallback(
    (claim) => allianceById(merchantById(claim.merchantId)?.allianceId),
    [allianceById, merchantById]
  );

  // ── 역할별 데이터 스코핑 ──────────────────────────────────
  // 얼라이언스↔대리점이 독립이므로 스코핑 기준은 항상 alliance_id 다.
  const canSee = useCallback(
    (allianceId) => {
      if (persona.role === "내부") return true;
      return allianceId === persona.scopeId;
    },
    [persona]
  );

  const visibleMerchants = useMemo(
    () => merchants.filter((m) => canSee(m.allianceId)),
    [merchants, canSee]
  );
  const visibleClaims = useMemo(
    () => claims.filter((c) => canSee(merchantById(c.merchantId)?.allianceId)),
    [claims, canSee, merchantById]
  );

  // ── 권한 ──────────────────────────────────────────────────
  const perms = {
    canRegister: persona.role === "얼라이언스사",
    canApproveMerchant: persona.role === "내부",
    canEditMerchant: persona.role === "내부",
    canRevertMerchant: persona.role === "내부",
    canSubmitClaim: persona.role === "얼라이언스사",
    canReviewClaim: persona.role === "내부",
    canSettle: persona.role === "내부",
    canRevertClaim: persona.role === "내부",
  };

  // 상태 전이는 항상 이력으로 남긴다 (누가·언제·왜)
  const logStatus = useCallback(async (rows, from, by, reason) => {
    const { error } = await supabase.from("claim_status_history").insert(
      rows.map((r) => ({
        claim_id: r.id,
        from_status: typeof from === "function" ? from(r.id) : from,
        to_status: r.status,
        by_user: by,
        reason,
      }))
    );
    if (error) console.error("[상태 이력 기록]", error);
  }, []);

  // 가맹점 변경 이력 (수정·승인취소 공용)
  const logMerchantEdit = useCallback(async (merchantId, by, reason, changes) => {
    const { data, error } = await supabase
      .from("merchant_edit_history")
      .insert({ merchant_id: merchantId, by_user: by, reason, changes })
      .select()
      .single();
    if (error) {
      console.error("[가맹점 이력 기록]", error);
      return null;
    }
    return toEdit(data);
  }, []);

  // ── 가맹점 액션 ────────────────────────────────────────────
  const registerMerchant = useCallback(
    async (data) => {
      const { data: row, error } = await supabase
        .from("merchants")
        .insert({
          id: nextIdFrom(merchants, "M"),
          name: data.name,
          biz_no: data.bizNo,
          cid: data.cid || null,
          store_type: data.storeType,
          prepaid_type: data.recruitType,
          agency_id: data.agencyId,
          alliance_id: data.allianceId,
          status: MERCHANT_STATUS.PENDING,
          registered_at: today(),
        })
        .select()
        .single();
      if (error) return fail(error, "가맹점 등록");

      const m = toMerchant(row);
      setMerchants((prev) => [m, ...prev]);
      flash(`가맹점 '${m.name}' 등록 완료 — 담당자 승인 대기`);
      return m;
    },
    [merchants, flash, fail]
  );

  const setMerchantStatus = useCallback(
    async (ids, status) => {
      const list = Array.isArray(ids) ? ids : [ids];
      const { data: rows, error } = await supabase
        .from("merchants")
        .update({ status })
        .in("id", list)
        .select();
      if (error) return fail(error, "가맹점 상태 변경");

      const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
      setMerchants((prev) => prev.map((m) => (byId[m.id] ? { ...m, status: byId[m.id].status } : m)));
      flash(list.length > 1 ? `${list.length}건 일괄 ${status}` : `가맹점 상태 → ${status}`);
    },
    [flash, fail]
  );

  const editMerchant = useCallback(
    async (id, changes, reason, editor) => {
      const { error } = await supabase
        .from("merchants")
        .update({ cid: changes.cid || null, prepaid_type: changes.recruitType, last_edited_by: editor })
        .eq("id", id);
      if (error) return fail(error, "가맹점 정보 수정");

      const h = await logMerchantEdit(id, editor, reason, changes);
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                ...changes,
                lastEditedBy: editor,
                editHistory: h ? [...m.editHistory, h] : m.editHistory,
              }
            : m
        )
      );
      flash("가맹점 정보 수정 완료 — 카카오페이 담당자에게 알림 발송(슬랙)");
    },
    [flash, fail, logMerchantEdit]
  );

  // 가맹점 승인 취소 (승인완료 → 등록대기). 시책 '승인 취소'와 동일 패턴.
  const revertMerchantStatus = useCallback(
    async (id, reason, editor) => {
      const { data: row, error } = await supabase
        .from("merchants")
        .update({ status: MERCHANT_STATUS.PENDING, last_edited_by: editor })
        .eq("id", id)
        .eq("status", MERCHANT_STATUS.APPROVED)
        .select()
        .single();
      if (error) return fail(error, "가맹점 승인 취소");

      const h = await logMerchantEdit(id, editor, reason, {
        status: `${MERCHANT_STATUS.APPROVED} → ${MERCHANT_STATUS.PENDING}`,
      });
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                status: row.status,
                lastEditedBy: editor,
                editHistory: h ? [...m.editHistory, h] : m.editHistory,
              }
            : m
        )
      );
      flash("가맹점 승인 취소 — 승인완료 → 등록대기");
    },
    [flash, fail, logMerchantEdit]
  );

  // ── 시책 액션 ──────────────────────────────────────────────
  const submitClaim = useCallback(
    async ({ merchantId, agencyId, type, claimMonth, proofPhoto }) => {
      const dup = claims.find(
        (c) => c.merchantId === merchantId && c.type === type && c.status !== CLAIM_STATUS.REJECTED
      );
      if (dup) {
        flash("이미 접수된 동일 유형 시책이 있습니다.");
        return null;
      }

      // 가맹모집만 결제검수 대상. 비가맹은 내부 확인 불가라 건수를 null로 둔다.
      // (실연동 시 콰트로 조회 결과로 채워질 자리)
      const merchant = merchantById(merchantId);
      const recruitClaim = type === CLAIM_TYPES.RECRUIT;
      const gamaeng = recruitClaim && isGamaeng(merchant?.recruitType);

      const { data: row, error } = await supabase
        .from("incentive_claims")
        .insert({
          id: nextIdFrom(claims, "C"),
          merchant_id: merchantId,
          agency_id: agencyId,
          type,
          claim_month: claimMonth,
          status: CLAIM_STATUS.REVIEW,
          is_active: recruitClaim ? false : null,
          txn_total: gamaeng ? 0 : null,
          proof_photo: type === CLAIM_TYPES.PROMO ? proofPhoto || "부착사진_증빙.jpg" : null,
          amount: INCENTIVE_AMOUNT[type],
        })
        .select()
        .single();
      if (error) return fail(error, "시책 접수");

      const created = toClaim(row);
      setClaims((prev) => [created, ...prev]);
      await logStatus([row], null, persona.label, "증빙 접수");
      flash("시책 증빙 접수 완료 — 검수 대기 상태로 전환");
      return created; // 호출측이 성공했을 때만 화면을 이동하도록
    },
    [claims, merchantById, flash, fail, logStatus, persona]
  );

  // 검수 승인/반려 (검수대기 → 정산대기 / 반려). 금액은 유형 상수로 자동.
  const reviewClaim = useCallback(
    async (ids, approve, editor) => {
      const list = Array.isArray(ids) ? ids : [ids];
      const next = approve ? CLAIM_STATUS.WAIT : CLAIM_STATUS.REJECTED;

      // 검수대기 건만 전이 — 이미 처리된 건은 DB에서 걸러진다
      const { data: rows, error } = await supabase
        .from("incentive_claims")
        .update({ status: next, reviewed_by: editor })
        .in("id", list)
        .eq("status", CLAIM_STATUS.REVIEW)
        .select();
      if (error) return fail(error, "시책 검수");

      const byId = Object.fromEntries(rows.map((r) => [r.id, toClaim(r)]));
      setClaims((prev) => prev.map((c) => byId[c.id] || c));
      await logStatus(rows, CLAIM_STATUS.REVIEW, editor, approve ? "검수 승인" : "검수 반려");
      flash(approve ? `검수 승인 → 정산 대기 (${rows.length}건)` : `반려 처리 (${rows.length}건)`);
    },
    [flash, fail, logStatus]
  );

  // 월정산 지급 확정 (정산대기 → 지급확정, 일괄)
  const confirmPayment = useCallback(
    async (ids, confirmedMonth) => {
      const list = Array.isArray(ids) ? ids : [ids];
      const { data: rows, error } = await supabase
        .from("incentive_claims")
        .update({ status: CLAIM_STATUS.PAID, confirmed_month: confirmedMonth })
        .in("id", list)
        .eq("status", CLAIM_STATUS.WAIT)
        .select();
      if (error) return fail(error, "지급 확정");

      const byId = Object.fromEntries(rows.map((r) => [r.id, toClaim(r)]));
      setClaims((prev) => prev.map((c) => byId[c.id] || c));
      await logStatus(rows, CLAIM_STATUS.WAIT, persona.label, `${confirmedMonth} 월정산 확정`);
      flash(`지급 확정 (${confirmedMonth}) — 대리점 계좌 월정산 반영 (${rows.length}건)`);
    },
    [flash, fail, logStatus, persona]
  );

  // 승인 취소 (정산대기·반려 → 검수대기). 지급확정 건은 되돌릴 수 없다.
  const revertClaim = useCallback(
    async (id, reason, editor) => {
      const current = claims.find((c) => c.id === id);
      if (!current || current.status === CLAIM_STATUS.PAID) {
        flash("지급확정된 시책은 되돌릴 수 없습니다.");
        return;
      }

      const { data: row, error } = await supabase
        .from("incentive_claims")
        .update({ status: CLAIM_STATUS.REVIEW, reviewed_by: null })
        .eq("id", id)
        .eq("status", current.status)
        .select()
        .single();
      if (error) return fail(error, "승인 취소");

      setClaims((prev) => prev.map((c) => (c.id === id ? toClaim(row) : c)));
      await logStatus([row], current.status, editor, reason);
      flash(`승인 취소 — ${current.status} → 검수대기`);
    },
    [claims, flash, fail, logStatus]
  );

  const value = {
    persona, setPersonaKey,
    alliances, agencies, agencyById, allianceById, allianceOfClaim, merchantById,
    merchants, claims, visibleMerchants, visibleClaims, perms,
    toast, loading, loadError,
    registerMerchant, setMerchantStatus, editMerchant, revertMerchantStatus,
    submitClaim, reviewClaim, confirmPayment, revertClaim,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
