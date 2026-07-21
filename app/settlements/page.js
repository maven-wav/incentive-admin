"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, Pill, Button, Th, Td, EmptyRow, TypeTag, Notice } from "@/components/ui";
import { CLAIM_STATUS } from "@/lib/mockData";

const won = (n) => n.toLocaleString("ko-KR") + "원";
const settleMonth = "2026-07";

export default function Settlements() {
  const { perms, visibleClaims, merchantById, agencyById, allianceOfAgency, confirmPayment, persona } = useStore();

  const waiting = visibleClaims.filter((c) => c.status === CLAIM_STATUS.WAIT);
  const paid = visibleClaims.filter((c) => c.status === CLAIM_STATUS.PAID);

  // 정산 대기: 대리점별 그룹
  const waitingByAgency = useMemo(() => {
    const map = {};
    waiting.forEach((c) => {
      (map[c.agencyId] ||= []).push(c);
    });
    return map;
  }, [waiting]);

  // 지급 확정: 확정월 + 대리점별 그룹
  const paidGroups = useMemo(() => {
    const map = {};
    paid.forEach((c) => {
      const key = `${c.confirmedMonth}__${c.agencyId}`;
      (map[key] ||= { month: c.confirmedMonth, agencyId: c.agencyId, items: [], total: 0 });
      map[key].items.push(c);
      map[key].total += c.amount;
    });
    return Object.values(map).sort((a, b) => (a.month < b.month ? 1 : -1));
  }, [paid]);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">지급/정산 조회</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          승인된 시책은 <b>월 1회 정산</b>으로 대리점 계좌에 지급됩니다. 지급 확정월 기준으로 조회할 수 있습니다.
        </p>
      </div>

      {/* 정산 대기 (내부만 확정 가능) */}
      <Card title="정산 대기" desc="검수 승인 완료 · 아직 미지급인 시책 (대리점별 묶음)">
        {Object.keys(waitingByAgency).length === 0 && (
          <div className="text-sm text-ink-400 py-6 text-center">정산 대기 건이 없습니다.</div>
        )}
        <div className="space-y-4">
          {Object.entries(waitingByAgency).map(([agencyId, items]) => {
            const total = items.reduce((s, c) => s + c.amount, 0);
            const agency = agencyById(agencyId);
            return (
              <div key={agencyId} className="rounded-2xl border border-line overflow-hidden">
                <div className="flex items-center justify-between bg-canvas px-5 py-3">
                  <div>
                    <div className="font-bold text-ink-900">
                      {agency?.name} <span className="text-xs font-normal text-ink-400">· {allianceOfAgency(agencyId)?.name}</span>
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">{agency?.bankAccount}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-ink-400">{items.length}건 합계</div>
                      <div className="font-extrabold text-ink-900">{won(total)}</div>
                    </div>
                    {perms.canSettle && (
                      <Button variant="primary" size="sm" onClick={() => confirmPayment(items.map((c) => c.id), settleMonth)}>
                        {settleMonth} 월정산 확정
                      </Button>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-line">
                  {items.map((c) => (
                    <li key={c.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                      <span className="flex items-center gap-2 text-ink-700">
                        {merchantById(c.merchantId)?.name} <TypeTag>{c.type}</TypeTag>
                        <span className="text-xs text-ink-400">접수 {c.claimMonth}</span>
                      </span>
                      <span className="font-semibold">{won(c.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {perms.canSettle && Object.keys(waitingByAgency).length > 0 && (
          <div className="mt-4">
            <Notice tone="yellow">월정산 확정 시 해당 대리점 계좌로 지급 반영되고 상태가 '지급확정'으로 전이됩니다.</Notice>
          </div>
        )}
      </Card>

      {/* 지급 확정 내역 */}
      <Card title="지급 확정 내역" desc="확정월 · 대리점별 정산 결과">
        <div className="overflow-x-auto -m-6">
          <table className="w-full border-collapse">
            <thead className="bg-canvas border-b border-line">
              <tr>
                <Th className="pl-5">확정월</Th>
                <Th>얼라이언스</Th>
                <Th>대리점</Th>
                <Th>계좌</Th>
                <Th>건수</Th>
                <Th className="text-right pr-5">정산 금액</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paidGroups.length === 0 && <EmptyRow colSpan={6} />}
              {paidGroups.map((g) => (
                <tr key={g.month + g.agencyId} className="hover:bg-canvas/60">
                  <Td className="pl-5">
                    <span className="inline-flex items-center gap-2">
                      {g.month} <Pill>지급확정</Pill>
                    </span>
                  </Td>
                  <Td>{allianceOfAgency(g.agencyId)?.name}</Td>
                  <Td className="font-semibold text-ink-900">{agencyById(g.agencyId)?.name}</Td>
                  <Td className="text-ink-500 text-xs">{agencyById(g.agencyId)?.bankAccount}</Td>
                  <Td>{g.items.length}건</Td>
                  <Td className="text-right pr-5 font-extrabold text-ink-900">{won(g.total)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
