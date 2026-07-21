"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, Pill, Button, Input, Select, Field, Th, Td, EmptyRow, Notice } from "@/components/ui";
import { MERCHANT_STATUS, PREPAID_TYPES } from "@/lib/mockData";

export default function MerchantList() {
  const { persona, perms, visibleMerchants, agencyById, allianceOfAgency, setMerchantStatus, editMerchant } = useStore();

  const [q, setQ] = useState("");
  const [fPrepaid, setFPrepaid] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [checked, setChecked] = useState({});
  const [editing, setEditing] = useState(null);

  const rows = useMemo(() => {
    return visibleMerchants.filter((m) => {
      const hay = `${m.name} ${m.bizNo} ${m.cid} ${agencyById(m.agencyId)?.name || ""} ${allianceOfAgency(m.agencyId)?.name || ""}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (fPrepaid && m.prepaidType !== fPrepaid) return false;
      if (fStatus && m.status !== fStatus) return false;
      if (from && m.registeredAt < from) return false;
      if (to && m.registeredAt > to) return false;
      return true;
    });
  }, [visibleMerchants, q, fPrepaid, fStatus, from, to, agencyById, allianceOfAgency]);

  const checkedIds = Object.keys(checked).filter((id) => checked[id]);
  const pendingCheckedIds = checkedIds.filter((id) => rows.find((r) => r.id === id)?.status === MERCHANT_STATUS.PENDING);
  const allChecked = rows.length > 0 && rows.every((r) => checked[r.id]);

  const toggleAll = () => {
    if (allChecked) setChecked({});
    else setChecked(Object.fromEntries(rows.map((r) => [r.id, true])));
  };

  const bulkApprove = () => {
    if (pendingCheckedIds.length === 0) return;
    setMerchantStatus(pendingCheckedIds, MERCHANT_STATUS.APPROVED);
    setChecked({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">등록내역</h1>
          <p className="text-sm text-ink-500 mt-1.5">
            가맹점명·대리점·CID·사업자번호로 검색하고 기간·상태·선후불로 필터할 수 있습니다.
          </p>
        </div>
        <span className="text-sm text-ink-400">{rows.length}건</span>
      </div>

      <Card>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2">
            <Field label="검색">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="가맹점명 / 대리점 / CID / 사업자번호" />
            </Field>
          </div>
          <Field label="조회기간 시작">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="조회기간 종료">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="선/후불">
            <Select value={fPrepaid} onChange={(e) => setFPrepaid(e.target.value)}>
              <option value="">전체</option>
              {PREPAID_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="상태">
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">전체</option>
              {Object.values(MERCHANT_STATUS).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setFPrepaid(""); setFStatus(""); setFrom(""); setTo(""); }}>
            필터 초기화
          </Button>
          <Button variant="ghost" size="sm" onClick={() => alert("대량등록 서식(CSV/XLSX)을 내려받아 작성 후 업로드하는 흐름 — 실제 개발 시 연결")}>
            ⬇ 서식 다운로드 (대량등록)
          </Button>
        </div>
      </Card>

      {perms.canApproveMerchant && (
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" disabled={pendingCheckedIds.length === 0} onClick={bulkApprove}>
            선택 일괄 승인 {pendingCheckedIds.length > 0 && `(${pendingCheckedIds.length})`}
          </Button>
          <span className="text-xs text-ink-400">등록대기 건을 체크해 한 번에 승인할 수 있습니다.</span>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto -m-6">
          <table className="w-full border-collapse">
            <thead className="bg-canvas border-b border-line">
              <tr>
                {perms.canApproveMerchant && (
                  <Th className="pl-5 w-10">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-kakao-yellowD w-4 h-4" />
                  </Th>
                )}
                <Th>등록일시</Th>
                <Th>가맹점명</Th>
                <Th>사업자등록번호</Th>
                <Th>선/후불</Th>
                <Th>CID</Th>
                <Th>얼라이언스</Th>
                <Th>대리점명</Th>
                <Th>상태</Th>
                <Th className="text-right pr-5">관리</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.length === 0 && <EmptyRow colSpan={perms.canApproveMerchant ? 10 : 9} />}
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-canvas/60">
                  {perms.canApproveMerchant && (
                    <Td className="pl-5">
                      <input
                        type="checkbox"
                        checked={!!checked[m.id]}
                        onChange={(e) => setChecked((c) => ({ ...c, [m.id]: e.target.checked }))}
                        className="accent-kakao-yellowD w-4 h-4"
                      />
                    </Td>
                  )}
                  <Td className="text-ink-500">{m.registeredAt}</Td>
                  <Td className="font-semibold text-ink-900">
                    {m.name}
                    {m.lastEditedBy && <span className="ml-1.5 text-[10px] text-amber-600 align-top">수정됨</span>}
                  </Td>
                  <Td className="text-ink-500">{m.bizNo}</Td>
                  <Td>{m.prepaidType}</Td>
                  <Td className="text-ink-500 font-mono text-xs">{m.cid || "—"}</Td>
                  <Td>{allianceOfAgency(m.agencyId)?.name}</Td>
                  <Td>{agencyById(m.agencyId)?.name}</Td>
                  <Td><Pill>{m.status}</Pill></Td>
                  <Td className="text-right pr-5 whitespace-nowrap">
                    {perms.canApproveMerchant && m.status === MERCHANT_STATUS.PENDING && (
                      <span className="inline-flex gap-1.5">
                        <Button size="sm" variant="approve" onClick={() => setMerchantStatus(m.id, MERCHANT_STATUS.APPROVED)}>승인</Button>
                        <Button size="sm" variant="danger" onClick={() => setMerchantStatus(m.id, MERCHANT_STATUS.REJECTED)}>반려</Button>
                      </span>
                    )}
                    {perms.canEditMerchant && (
                      <Button size="sm" variant="ghost" className="ml-1.5" onClick={() => setEditing(m)}>수정</Button>
                    )}
                    {!perms.canApproveMerchant && !perms.canEditMerchant && <span className="text-xs text-ink-300">—</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <EditModal
          merchant={editing}
          onClose={() => setEditing(null)}
          onSave={(changes, reason) => {
            editMerchant(editing.id, changes, reason, persona.label);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EditModal({ merchant, onClose, onSave }) {
  const [cid, setCid] = useState(merchant.cid);
  const [prepaidType, setPrepaidType] = useState(merchant.prepaidType);
  const [reason, setReason] = useState("");
  const dirty = cid !== merchant.cid || prepaidType !== merchant.prepaidType;

  return (
    <div className="fixed inset-0 z-40 bg-ink-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-line">
          <h3 className="font-bold text-ink-900">가맹점 정보 수정 — {merchant.name}</h3>
          <p className="text-xs text-ink-500 mt-1">권한에 따라 CID · 선/후불 구분을 수정할 수 있습니다.</p>
        </header>
        <div className="p-6 space-y-5">
          <Field label="CID">
            <Input value={cid} onChange={(e) => setCid(e.target.value)} placeholder="CID" />
          </Field>
          <Field label="선/후불 구분">
            <Select value={prepaidType} onChange={(e) => setPrepaidType(e.target.value)}>
              {PREPAID_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="수정 사유" hint="수정 시 최종 수정자·사유가 이력에 남고 카카오페이 담당자에게 슬랙 알림이 발송됩니다.">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예) CID 매핑 정정" />
          </Field>
          {merchant.editHistory.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-ink-700 mb-1.5">수정 이력</div>
              <ul className="space-y-1">
                {merchant.editHistory.map((h, i) => (
                  <li key={i} className="text-[11px] text-ink-500 bg-canvas rounded-lg px-2.5 py-1.5">
                    {h.at} · {h.by} · {h.reason || "사유없음"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!reason && dirty && <Notice tone="warn">수정 사유를 입력해야 저장할 수 있습니다.</Notice>}
        </div>
        <footer className="px-6 py-4 border-t border-line flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button variant="primary" disabled={!dirty || !reason} onClick={() => onSave({ cid, prepaidType }, reason)}>저장</Button>
        </footer>
      </div>
    </div>
  );
}
