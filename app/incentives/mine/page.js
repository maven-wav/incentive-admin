"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { proofPublicUrl } from "@/lib/supabase";
import { Card, Pill, Button, Select, Field, Th, Td, EmptyRow, Notice, TypeTag } from "@/components/ui";
import { CLAIM_STATUS, CLAIM_TYPES, PHOTO_CLAIM_TYPES } from "@/lib/mockData";

const won = (n) => n.toLocaleString("ko-KR") + "원";

export default function MyClaims() {
  const { perms, visibleClaims, merchantById, agencyById, allianceOfClaim, withdrawClaim } = useStore();
  const [fStatus, setFStatus] = useState("");
  const [photo, setPhoto] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);

  const rows = useMemo(
    () => visibleClaims.filter((c) => (fStatus ? c.status === fStatus : true)),
    [visibleClaims, fStatus]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">시책 내역</h1>
          <p className="text-sm text-ink-500 mt-1.5">
            내가 접수한 시책의 진행 상태를 확인합니다. 잘못 올린 건은 <b>검수대기</b> 상태에서만 직접 철회할 수 있습니다.
          </p>
        </div>
        <span className="text-sm text-ink-400">{rows.length}건</span>
      </div>

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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto -m-6">
          <table className="w-full border-collapse">
            <thead className="bg-canvas border-b border-line">
              <tr>
                <Th className="pl-5">가맹점</Th>
                <Th>시책유형</Th>
                <Th>모집유형</Th>
                <Th>얼라이언스</Th>
                <Th>접수월</Th>
                <Th>증빙/결제검수</Th>
                <Th>금액</Th>
                <Th>상태</Th>
                <Th className="text-right pr-5">관리</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && <EmptyRow colSpan={9} text="접수한 시책이 없습니다." />}
              {rows.map((c) => {
                const m = merchantById(c.merchantId);
                const canWithdraw =
                  perms.canWithdrawOwnClaim &&
                  c.status === CLAIM_STATUS.REVIEW &&
                  c.type !== CLAIM_TYPES.RECRUIT; // 가맹 자동생성 건은 대리점이 철회하지 않는다
                return (
                  <tr key={c.id} className="hover:bg-canvas/60">
                    <Td className="pl-5 font-semibold text-ink-900">{m?.name}</Td>
                    <Td><TypeTag>{c.type}</TypeTag></Td>
                    <Td className="text-ink-500">{m?.recruitType || "—"}</Td>
                    <Td>{allianceOfClaim(c)?.name}</Td>
                    <Td className="text-ink-500">{c.claimMonth}</Td>
                    <Td>
                      {c.type === CLAIM_TYPES.RECRUIT ? (
                        <span className="text-xs text-ink-400">가맹 자동접수</span>
                      ) : c.type === CLAIM_TYPES.NONGAMAENG_TXN ? (
                        <span className="text-xs text-ink-500 font-mono">{c.txnTotal ?? 0}건</span>
                      ) : PHOTO_CLAIM_TYPES.includes(c.type) ? (
                        <button className="text-xs font-semibold text-sky-600 hover:underline" onClick={() => setPhoto(c.proofPhoto)}>
                          🖼 사진 보기
                        </button>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </Td>
                    <Td className="font-semibold">{won(c.amount)}</Td>
                    <Td><Pill>{c.status}</Pill></Td>
                    <Td className="text-right pr-5 whitespace-nowrap">
                      {canWithdraw ? (
                        <Button size="sm" variant="danger" onClick={() => setWithdrawing(c)}>철회</Button>
                      ) : (
                        <span className="text-xs text-ink-300">—</span>
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
              <ProofImage key={photo} path={photo} />
              <div className="text-sm text-ink-500 mt-3 break-all">{photo}</div>
            </div>
            <div className="px-6 py-4 border-t border-line flex justify-end">
              <Button variant="ghost" onClick={() => setPhoto(null)}>닫기</Button>
            </div>
          </div>
        </div>
      )}

      {withdrawing && (
        <WithdrawModal
          claim={withdrawing}
          merchantName={merchantById(withdrawing.merchantId)?.name}
          onClose={() => setWithdrawing(null)}
          onConfirm={() => {
            withdrawClaim(withdrawing.id);
            setWithdrawing(null);
          }}
        />
      )}
    </div>
  );
}

// 부착 사진 — 초기 시드는 실제 파일이 없어 로드 실패 시 안내로 대체.
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

// 대리점 자가 철회 — 검수대기 건 한정. 되돌릴 수 없어 확인 모달을 거친다.
function WithdrawModal({ claim, merchantName, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-40 bg-ink-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-line">
          <h3 className="font-bold text-ink-900">시책 철회 — {merchantName}</h3>
        </header>
        <div className="p-6">
          <Notice tone="warn">
            <b>{claim.type}</b> 시책({claim.claimMonth}) 접수를 철회합니다. 검수대기 상태에서만 가능하며, 되돌릴 수 없습니다.
          </Notice>
        </div>
        <footer className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button variant="danger" onClick={onConfirm}>철회</Button>
        </footer>
      </div>
    </div>
  );
}
