"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import {
  alliances,
  agencies,
  merchants as seedMerchants,
  claims as seedClaims,
  MERCHANT_STATUS,
  CLAIM_STATUS,
  INCENTIVE_AMOUNT,
} from "./mockData";

const StoreContext = createContext(null);

// 데모용 전환 가능한 페르소나 (실제로는 Supabase Auth 로그인으로 대체)
export const PERSONAS = [
  { key: "internal", role: "내부", label: "내부 담당자 (카카오페이)", scopeId: null },
  { key: "al01", role: "얼라이언스사", label: "얼라이언스: 오케이포스", scopeId: "AL01" },
  { key: "al02", role: "얼라이언스사", label: "얼라이언스: KICC", scopeId: "AL02" },
  { key: "ag01", role: "대리점", label: "VAN대리점: 승리정보통신", scopeId: "AG01" },
  { key: "ag02", role: "대리점", label: "VAN대리점: 현페이먼트", scopeId: "AG02" },
];

let _idSeq = 9000;
const nextId = (prefix) => `${prefix}${++_idSeq}`;
const today = () => new Date().toISOString().slice(0, 10);
const nowMin = () => new Date().toISOString().slice(0, 16).replace("T", " ");

export function StoreProvider({ children }) {
  const [personaKey, setPersonaKey] = useState("internal");
  const [merchants, setMerchants] = useState(seedMerchants);
  const [claims, setClaims] = useState(seedClaims);
  const [toast, setToast] = useState(null);

  const persona = PERSONAS.find((p) => p.key === personaKey);

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const agencyById = useCallback((id) => agencies.find((a) => a.id === id), []);
  const allianceOfAgency = useCallback(
    (agencyId) => alliances.find((al) => al.id === agencyById(agencyId)?.allianceId),
    [agencyById]
  );
  const merchantById = useCallback((id) => merchants.find((m) => m.id === id), [merchants]);

  // ── 역할별 데이터 스코핑 ──────────────────────────────────
  const canSeeAgency = useCallback(
    (agencyId) => {
      if (persona.role === "내부") return true;
      if (persona.role === "얼라이언스사") return agencyById(agencyId)?.allianceId === persona.scopeId;
      if (persona.role === "대리점") return agencyId === persona.scopeId;
      return false;
    },
    [persona, agencyById]
  );

  const visibleMerchants = useMemo(
    () => merchants.filter((m) => canSeeAgency(m.agencyId)),
    [merchants, canSeeAgency]
  );
  const visibleClaims = useMemo(
    () => claims.filter((c) => canSeeAgency(c.agencyId)),
    [claims, canSeeAgency]
  );

  // ── 권한 ──────────────────────────────────────────────────
  const perms = {
    canRegister: persona.role === "대리점" || persona.role === "얼라이언스사",
    canApproveMerchant: persona.role === "내부",
    canEditMerchant: persona.role === "내부",
    canSubmitClaim: persona.role === "대리점" || persona.role === "얼라이언스사",
    canReviewClaim: persona.role === "내부",
    canSettle: persona.role === "내부",
  };

  // ── 가맹점 액션 ────────────────────────────────────────────
  const registerMerchant = useCallback(
    (data) => {
      const m = {
        id: nextId("M"), editHistory: [], lastEditedBy: null,
        status: MERCHANT_STATUS.PENDING, registeredAt: today(), ...data,
      };
      setMerchants((prev) => [m, ...prev]);
      flash(`가맹점 '${m.name}' 등록 완료 — 담당자 승인 대기`);
      return m;
    },
    [flash]
  );

  const setMerchantStatus = useCallback(
    (ids, status) => {
      const list = Array.isArray(ids) ? ids : [ids];
      setMerchants((prev) => prev.map((m) => (list.includes(m.id) ? { ...m, status } : m)));
      flash(list.length > 1 ? `${list.length}건 일괄 ${status}` : `가맹점 상태 → ${status}`);
    },
    [flash]
  );

  const editMerchant = useCallback(
    (id, changes, reason, editor) => {
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m, ...changes, lastEditedBy: editor,
                editHistory: [...m.editHistory, { at: nowMin(), by: editor, reason, changes }],
              }
            : m
        )
      );
      flash("가맹점 정보 수정 완료 — 카카오페이 담당자에게 알림 발송(슬랙)");
    },
    [flash]
  );

  // ── 시책 액션 ──────────────────────────────────────────────
  const submitClaim = useCallback(
    ({ merchantId, agencyId, type, claimMonth, proofPhoto }) => {
      const dup = claims.find(
        (c) => c.merchantId === merchantId && c.type === type && c.status !== CLAIM_STATUS.REJECTED
      );
      if (dup) {
        flash("이미 접수된 동일 유형 시책이 있습니다.");
        return;
      }
      const c = {
        id: nextId("C"), merchantId, agencyId, type, claimMonth,
        status: CLAIM_STATUS.REVIEW,
        txnCounts: type === "가맹모집" ? [0, 0, 0] : null,
        proofPhoto: type === "홍보물부착" ? proofPhoto || "부착사진_증빙.jpg" : null,
        reviewedBy: null, confirmedMonth: null, amount: INCENTIVE_AMOUNT[type],
      };
      setClaims((prev) => [c, ...prev]);
      flash("시책 증빙 접수 완료 — 검수 대기 상태로 전환");
    },
    [claims, flash]
  );

  // 검수 승인/반려 (요청 → 정산대기 / 반려). 금액은 유형 상수로 자동.
  const reviewClaim = useCallback(
    (ids, approve, editor) => {
      const list = Array.isArray(ids) ? ids : [ids];
      setClaims((prev) =>
        prev.map((c) =>
          list.includes(c.id) && c.status === CLAIM_STATUS.REVIEW
            ? { ...c, status: approve ? CLAIM_STATUS.WAIT : CLAIM_STATUS.REJECTED, reviewedBy: editor }
            : c
        )
      );
      flash(approve ? `검수 승인 → 정산 대기 (${list.length}건)` : `반려 처리 (${list.length}건)`);
    },
    [flash]
  );

  // 월정산 지급 확정 (정산대기 → 지급확정, 일괄)
  const confirmPayment = useCallback(
    (ids, confirmedMonth) => {
      const list = Array.isArray(ids) ? ids : [ids];
      setClaims((prev) =>
        prev.map((c) =>
          list.includes(c.id) && c.status === CLAIM_STATUS.WAIT
            ? { ...c, status: CLAIM_STATUS.PAID, confirmedMonth }
            : c
        )
      );
      flash(`지급 확정 (${confirmedMonth}) — 대리점 계좌 월정산 반영 (${list.length}건)`);
    },
    [flash]
  );

  const value = {
    persona, setPersonaKey,
    alliances, agencies, agencyById, allianceOfAgency, merchantById,
    merchants, claims, visibleMerchants, visibleClaims, perms,
    toast,
    registerMerchant, setMerchantStatus, editMerchant,
    submitClaim, reviewClaim, confirmPayment,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
