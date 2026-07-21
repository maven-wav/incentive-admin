"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, Pill, TypeTag } from "@/components/ui";
import { MERCHANT_STATUS, CLAIM_STATUS } from "@/lib/mockData";

const won = (n) => n.toLocaleString("ko-KR") + "원";

function Stat({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-line shadow-card p-5 relative overflow-hidden">
      {accent && <span className="absolute top-0 left-0 w-full h-1 bg-kakao-yellow" />}
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-2xl font-extrabold mt-1.5 text-ink-900">{value}</div>
      {sub && <div className="text-[11px] text-ink-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { persona, visibleMerchants, visibleClaims, merchantById } = useStore();

  const pendingMerchants = visibleMerchants.filter((m) => m.status === MERCHANT_STATUS.PENDING);
  const approvedMerchants = visibleMerchants.filter((m) => m.status === MERCHANT_STATUS.APPROVED);
  const reviewClaims = visibleClaims.filter((c) => c.status === CLAIM_STATUS.REVIEW);
  const waitClaims = visibleClaims.filter((c) => c.status === CLAIM_STATUS.WAIT);
  const paidClaims = visibleClaims.filter((c) => c.status === CLAIM_STATUS.PAID);

  const payable = waitClaims.reduce((s, c) => s + c.amount, 0);
  const paid = paidClaims.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">대시보드</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          {persona.role} 관점 요약 — 우측 상단에서 역할을 바꿔 대리점↔담당자 흐름을 확인해보세요.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="등록 대기 가맹점" value={pendingMerchants.length} sub="담당자 승인 필요" accent />
        <Stat label="승인완료 가맹점" value={approvedMerchants.length} />
        <Stat label="검수 대기 시책" value={reviewClaims.length} sub="콰트로/사진 검수" accent />
        <Stat label="정산 대기 금액" value={won(payable)} sub="승인·미지급" />
        <Stat label="지급 확정 누적" value={won(paid)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="승인 대기 가맹점" desc="등록 후 담당자 승인을 기다리는 건">
          <ul className="divide-y divide-line">
            {pendingMerchants.length === 0 && (
              <li className="text-sm text-ink-400 py-8 text-center">대기 중인 건이 없습니다.</li>
            )}
            {pendingMerchants.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold text-ink-800">{m.name}</div>
                  <div className="text-xs text-ink-400 mt-0.5">
                    {m.storeType} · {m.prepaidType} · 등록 {m.registeredAt}
                  </div>
                </div>
                <Pill>{m.status}</Pill>
              </li>
            ))}
          </ul>
          <Link href="/merchants" className="inline-block mt-4 text-xs font-semibold text-ink-500 hover:text-ink-900">
            등록내역 전체 보기 →
          </Link>
        </Card>

        <Card title="검수 대기 시책" desc="증빙 접수 후 검수를 기다리는 건">
          <ul className="divide-y divide-line">
            {reviewClaims.length === 0 && (
              <li className="text-sm text-ink-400 py-8 text-center">대기 중인 시책이 없습니다.</li>
            )}
            {reviewClaims.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-semibold text-ink-800 flex items-center gap-2">
                    {merchantById(c.merchantId)?.name}
                    <TypeTag>{c.type}</TypeTag>
                  </div>
                  <div className="text-xs text-ink-400 mt-0.5">접수월 {c.claimMonth}</div>
                </div>
                <Pill>{c.status}</Pill>
              </li>
            ))}
          </ul>
          <Link href="/incentives/review" className="inline-block mt-4 text-xs font-semibold text-ink-500 hover:text-ink-900">
            시책 검수로 이동 →
          </Link>
        </Card>
      </div>
    </div>
  );
}
