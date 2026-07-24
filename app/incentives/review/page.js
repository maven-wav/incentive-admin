"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { proofPublicUrl } from "@/lib/supabase";
import { Card, Pill, Button, Input, Select, Field, Th, Td, EmptyRow, Notice, TypeTag, YN } from "@/components/ui";
import { CLAIM_STATUS, CLAIM_TYPES, TXN_TOTAL_CRITERIA } from "@/lib/mockData";
import { verifyPayment } from "@/lib/quatro";

const won = (n) => n.toLocaleString("ko-KR") + "원";

export default function ReviewClaims() {
  const {
    perms, visibleClaims, merchantById, agencyById, allianceOfClaim,
    reviewClaim, revertClaim, deleteClaim, persona,
  } = useStore();
  const [fStatus, setFStatus] = useState("");
  const [checked, setChecked] = useState({});
  const [photo, setPhoto] = useState(null);
  const [reverting, setReverting] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const rows = useMemo(
    () => visibleClaims.filter((c) => (fStatus ? c.status === fStatus : true)),
    [visibleClaims, fStatus]
  );

  const checkedIds = Object.keys(checked).filter((id) => checked[id]);
  const reviewCheckedIds = checkedIds.filter((id) => rows.find((r) => r.id === id)?.status === CLAIM_STATUS.REVIEW);
  const allChecked = rows.length > 0 && rows.every((r) => checked[r.id]);
  const toggleAll = () => (allChecked ? setChecked({}) : setChecked(Object.fromEntries(rows.map((r) => [r.id, true]))));

  if (!perms.canReviewClaim) {
    return (
      <Card title="시책 검수">
        <Notice tone="warn">시책 검수는 <b>내부 담당자</b> 전용 화면입니다. 우측 상단에서 '내부 담당자'로 전환해 보세요.</Notice>
      </Card>
    );
  }

  const bulkApprove = () => {
    if (reviewCheckedIds.length === 0) return;
    reviewClaim(reviewCheckedIds, true, persona.label);
    setChecked({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">시책 검수</h1>
          <p className="text-sm text-ink-500 mt-1.5">
            가맹모집(가맹 등록 시 자동접수)은 결제검수(가맹 · 활성화 · 3개월 총 결제 {TXN_TOTAL_CRITERIA}건 이상 → 자동충족),
            비가맹결제건수는 대리점이 입력한 건수를 수동 판단, QR·홍보물부착은 부착 사진을 확인 후 승인합니다.
          </p>
        </div>
        <span className="text-sm text-ink-400">{rows.length}건</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="w-48">
          <Field label="상태 필터">
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">전체</option>
              {Object.values(CLAIM_STATUS).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Button variant="primary" size="sm" disabled={reviewCheckedIds.length === 0} onClick={bulkApprove}>
          선택 일괄 승인 → 정산대기 {reviewCheckedIds.length > 0 && `(${reviewCheckedIds.length})`}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto -m-6">
          <table className="w-full border-collapse">
            <thead className="bg-canvas border-b border-line">
              <tr>
                <Th className="pl-5 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-kakao-yellowD w-4 h-4" />
                </Th>
                <Th>가맹점</Th>
                <Th>시책유형</Th>
                <Th>모집유형</Th>
                <Th>얼라이언스</Th>
                <Th>대리점</Th>
                <Th>접수월</Th>
                <Th>결제검수</Th>
                <Th>금액</Th>
                <Th>상태</Th>
                <Th className="text-right pr-5">검수</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && <EmptyRow colSpan={11} />}
              {rows.map((c) => {
                const m = merchantById(c.merchantId);
                return (
                  <tr key={c.id} className="hover:bg-canvas/60">
                    <Td className="pl-5">
                      <input
                        type="checkbox"
                        checked={!!checked[c.id]}
                        onChange={(e) => setChecked((s) => ({ ...s, [c.id]: e.target.checked }))}
                        className="accent-kakao-yellowD w-4 h-4"
                      />
                    </Td>
                    <Td className="font-semibold text-ink-900">{m?.name}</Td>
                    <Td><TypeTag>{c.type}</TypeTag></Td>
                    <Td className="text-ink-500">{m?.recruitType || "—"}</Td>
                    <Td>{allianceOfClaim(c)?.name}</Td>
                    <Td>{agencyById(c.agencyId)?.name}</Td>
                    <Td className="text-ink-500">{c.claimMonth}</Td>
                    <Td>
                      {c.type === CLAIM_TYPES.RECRUIT ? (
                        <PaymentReview claim={c} recruitType={m?.recruitType} />
                      ) : c.type === CLAIM_TYPES.NONGAMAENG_TXN ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ink-500 font-mono">{c.txnTotal ?? 0}건</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-100">
                            수동판단
                          </span>
                        </div>
                      ) : (
                        <button className="text-xs font-semibold text-sky-600 hover:underline" onClick={() => setPhoto(c.proofPhoto)}>
                          🖼 사진 보기
                        </button>
                      )}
                    </Td>
                    <Td className="font-semibold">{won(c.amount)}</Td>
                    <Td><Pill>{c.status}</Pill></Td>
                    <Td className="text-right pr-5 whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {c.status === CLAIM_STATUS.REVIEW ? (
                          <>
                            <Button size="sm" variant="approve" onClick={() => reviewClaim(c.id, true, persona.label)}>승인</Button>
                            <Button size="sm" variant="danger" onClick={() => reviewClaim(c.id, false, persona.label)}>반려</Button>
                          </>
                        ) : c.status === CLAIM_STATUS.PAID ? (
                          <span className="text-xs text-ink-400" title="지급확정 건은 되돌릴 수 없습니다">🔒 지급확정</span>
                        ) : perms.canRevertClaim ? (
                          <Button size="sm" variant="ghost" onClick={() => setReverting(c)}>승인 취소</Button>
                        ) : (
                          <span className="text-xs text-ink-400">{c.reviewedBy || "—"}</span>
                        )}
                        {perms.canDelete && c.status !== CLAIM_STATUS.PAID && (
                          <Button size="sm" variant="danger" className="ml-1" onClick={() => setDeleting(c)}>삭제</Button>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {photo && (
        <div className="fixed inset-0 z-40 bg-ink-900/50 flex items-center justify-center p-4" onClick={() => setPhoto(null)}>
          <div className="bg-white rounded-2xl shadow-pop w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-line font-bold text-ink-900">부착 사진 증빙</div>
            <div className="p-6">
              <ProofImage key={photo} path={photo} />
              <div className="text-sm text-ink-500 mt-3 break-all">{photo}</div>
            </div>
            <div className="px-6 py-4 border-t border-line flex justify-end">
              <Button variant="ghost" onClick={() => setPhoto(null)}>닫기</Button>
            </div>
          </div>
        </div>
      )}

      {reverting && (
        <RevertModal
          claim={reverting}
          merchantName={merchantById(reverting.merchantId)?.name}
          onClose={() => setReverting(null)}
          onConfirm={(reason) => {
            revertClaim(reverting.id, reason, persona.label);
            setReverting(null);
          }}
        />
      )}

      {deleting && (
        <DeleteClaimModal
          claim={deleting}
          merchantName={merchantById(deleting.merchantId)?.name}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            deleteClaim(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

// 시책 삭제 — 되돌릴 수 없으므로 확인 모달을 거친다 (브라우저 confirm 대신).
function DeleteClaimModal({ claim, merchantName, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-40 bg-ink-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-line">
          <h3 className="font-bold text-ink-900">시책 삭제 — {merchantName}</h3>
        </header>
        <div className="p-6">
          <Notice tone="warn">
            <b>{claim.type}</b> 시책({claim.claimMonth})을 삭제합니다. 이 작업은 되돌릴 수 없습니다.
          </Notice>
        </div>
        <footer className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button variant="danger" onClick={onConfirm}>삭제</Button>
        </footer>
      </div>
    </div>
  );
}

// 부착 사진 — Storage 업로드 이미지를 그대로 보여준다.
// 초기 시드는 실제 파일이 없는 파일명 문자열이라 로드에 실패한다 → 안내로 대체.
function ProofImage({ path }) {
  const [failed, setFailed] = useState(false);
  const url = proofPublicUrl(path);

  if (!url || failed) {
    return (
      <div className="space-y-3">
        <div className="aspect-video rounded-xl bg-gradient-to-br from-kakao-yellow/40 to-canvas flex items-center justify-center text-5xl">🏪</div>
        <Notice tone="warn">실제 업로드 이미지가 없는 초기 시드 데이터입니다. 새로 접수한 건은 업로드 사진이 표시됩니다.</Notice>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="부착 사진 증빙"
      onError={() => setFailed(true)}
      className="w-full max-h-[60vh] object-contain rounded-xl border border-line bg-canvas"
    />
  );
}

// 결제검수 = 가맹여부 · 활성화 · 3개월 총 결제건수
// 비가맹은 내부에서 확인할 수 없어 항상 수동 판단으로 넘어간다.
function PaymentReview({ claim, recruitType }) {
  const v = verifyPayment({ recruitType, isActive: claim.isActive, txnTotal: claim.txnTotal });

  if (!v.gamaeng) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-slate-50 text-ink-500 border-line">
          비가맹
        </span>
        <span className="text-xs text-ink-400">확인불가 · 수동판단</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs text-ink-500">
        활성화 <YN value={v.active} />
      </span>
      <span className="text-xs text-ink-500 font-mono">{v.txnTotal}건</span>
      {v.auto ? (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-100">
          자동충족
        </span>
      ) : (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-amber-50 text-amber-700 border-amber-100">
          수동판단
        </span>
      )}
    </div>
  );
}

// 상태 되돌리기 — 사유를 반드시 남긴다 (claim_status_history에 기록됨)
function RevertModal({ claim, merchantName, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-40 bg-ink-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-line">
          <h3 className="font-bold text-ink-900">승인 취소 — {merchantName}</h3>
          <p className="text-xs text-ink-500 mt-1">
            <b>{claim.status}</b> → <b>검수대기</b> 로 되돌립니다. 검수자 정보는 초기화됩니다.
          </p>
        </header>
        <div className="p-6 space-y-5">
          <Field label="취소 사유" hint="누가·언제·왜 되돌렸는지 상태 이력에 기록됩니다.">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예) 증빙 사진 오등록으로 재검수 필요" />
          </Field>
          {!reason && <Notice tone="warn">취소 사유를 입력해야 되돌릴 수 있습니다.</Notice>}
        </div>
        <footer className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>닫기</Button>
          <Button variant="danger" disabled={!reason} onClick={() => onConfirm(reason)}>승인 취소</Button>
        </footer>
      </div>
    </div>
  );
}
