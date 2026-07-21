"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, Pill, Button, Input, Select, Field, Th, Td, EmptyRow, Notice, TypeTag, YN } from "@/components/ui";
import { CLAIM_STATUS, TXN_CRITERIA } from "@/lib/mockData";
import { verifyPayment } from "@/lib/quatro";

const won = (n) => n.toLocaleString("ko-KR") + "원";

export default function ReviewClaims() {
  const { perms, visibleClaims, merchantById, agencyById, allianceOfAgency, reviewClaim, revertClaim, persona } = useStore();
  const [fStatus, setFStatus] = useState("");
  const [checked, setChecked] = useState({});
  const [photo, setPhoto] = useState(null);
  const [reverting, setReverting] = useState(null);

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
            검수대기 건을 확인합니다. 가맹모집은 콰트로 결제검수(등록월 포함 최근 3개월, 각 월 {TXN_CRITERIA}건 이상 = Y),
            홍보물부착은 부착 사진을 확인 후 승인합니다.
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
                <Th>유형</Th>
                <Th>얼라이언스</Th>
                <Th>대리점</Th>
                <Th>접수월</Th>
                <Th>결제검수 (콰트로)</Th>
                <Th>금액</Th>
                <Th>상태</Th>
                <Th className="text-right pr-5">검수</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && <EmptyRow colSpan={10} />}
              {rows.map((c) => {
                const m = merchantById(c.merchantId);
                const v = c.type === "가맹모집" ? verifyPayment(c.txnCounts) : null;
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
                    <Td>{allianceOfAgency(c.agencyId)?.name}</Td>
                    <Td>{agencyById(c.agencyId)?.name}</Td>
                    <Td className="text-ink-500">{c.claimMonth}</Td>
                    <Td>
                      {c.type === "가맹모집" ? (
                        <div className="flex items-center gap-2">
                          <YN value={v.pass} />
                          <span className="text-xs text-ink-400 font-mono">[{c.txnCounts.join(", ")}]</span>
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
                      {c.status === CLAIM_STATUS.REVIEW ? (
                        <span className="inline-flex gap-1.5">
                          <Button size="sm" variant="approve" onClick={() => reviewClaim(c.id, true, persona.label)}>승인</Button>
                          <Button size="sm" variant="danger" onClick={() => reviewClaim(c.id, false, persona.label)}>반려</Button>
                        </span>
                      ) : c.status === CLAIM_STATUS.PAID ? (
                        <span className="text-xs text-ink-400" title="지급확정 건은 되돌릴 수 없습니다">🔒 지급확정</span>
                      ) : perms.canRevertClaim ? (
                        <Button size="sm" variant="ghost" onClick={() => setReverting(c)}>승인 취소</Button>
                      ) : (
                        <span className="text-xs text-ink-400">{c.reviewedBy || "—"}</span>
                      )}
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
              <div className="aspect-video rounded-xl bg-gradient-to-br from-kakao-yellow/40 to-canvas flex items-center justify-center text-5xl">🏪</div>
              <div className="text-sm text-ink-500 mt-3">{photo}</div>
              <Notice tone="info" >프로토타입 예시 이미지입니다 · 실개발 시 Supabase Storage 업로드 이미지가 표시됩니다.</Notice>
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
