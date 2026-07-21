"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, Field, Select, Button, Notice, TypeTag } from "@/components/ui";
import { CLAIM_TYPES, INCENTIVE_AMOUNT, MERCHANT_STATUS } from "@/lib/mockData";

const won = (n) => n.toLocaleString("ko-KR") + "원";
const thisMonth = "2026-07";

export default function SubmitClaim() {
  const router = useRouter();
  const { persona, perms, visibleMerchants, agencyById, submitClaim } = useStore();

  const approved = visibleMerchants.filter((m) => m.status === MERCHANT_STATUS.APPROVED);
  const [type, setType] = useState(CLAIM_TYPES.RECRUIT);
  const [merchantId, setMerchantId] = useState(approved[0]?.id || "");
  const [claimMonth, setClaimMonth] = useState(thisMonth);
  const [photo, setPhoto] = useState(null);

  if (!perms.canSubmitClaim) {
    return (
      <Card title="시책 접수">
        <Notice tone="warn">
          시책 접수(증빙 등록)는 <b>대리점 / 얼라이언스사</b> 권한에서만 가능합니다. 우측 상단에서 역할을 전환해 보세요.
        </Notice>
      </Card>
    );
  }

  const merchant = approved.find((m) => m.id === merchantId);
  const needPhoto = type === CLAIM_TYPES.PROMO;
  const canSubmit = merchant && (!needPhoto || photo);

  const submit = () => {
    if (!canSubmit) return;
    submitClaim({
      merchantId, agencyId: merchant.agencyId, type, claimMonth,
      proofPhoto: needPhoto ? photo : null,
    });
    router.push("/incentives/review");
  };

  return (
    <div className="space-y-7 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">시책 접수 (증빙 등록)</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          기 등록된 가맹점에 대해 시책을 접수합니다. 접수 완료 시 검수대기 상태로 진입합니다.
        </p>
      </div>

      <Card title="① 시책 유형 분기" desc="가맹 모집 / 홍보물 부착">
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: CLAIM_TYPES.RECRUIT, emoji: "🤝", desc: "가맹 연결 — 콰트로 결제검수(월 3건 기준)로 자동 검증" },
            { key: CLAIM_TYPES.PROMO, emoji: "📸", desc: "홍보물 부착 — 부착 사진 업로드, 담당자 육안 검수" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`text-left rounded-2xl border p-5 transition ${
                type === t.key
                  ? "border-kakao-yellowD bg-kakao-yellow/15 ring-2 ring-kakao-yellow/40"
                  : "border-line bg-white hover:border-ink-300"
              }`}
            >
              <div className="text-2xl">{t.emoji}</div>
              <div className="font-bold text-ink-900 mt-2 flex items-center gap-2">
                {t.key} <TypeTag>{t.key}</TypeTag>
              </div>
              <div className="text-xs text-ink-500 mt-1.5 leading-relaxed">{t.desc}</div>
              <div className="text-xs font-semibold text-ink-700 mt-2">단가 {won(INCENTIVE_AMOUNT[t.key])}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="② 대상 가맹점 & 증빙">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="가맹점 (승인완료 건만)">
            <Select value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>
              {approved.length === 0 && <option value="">승인완료 가맹점 없음</option>}
              {approved.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({agencyById(m.agencyId)?.name})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="접수월" hint="대리점별 등록월 기준 정산 (등록월 +3M까지 접수 가능)">
            <Select value={claimMonth} onChange={(e) => setClaimMonth(e.target.value)}>
              {["2026-05", "2026-06", "2026-07"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
        </div>

        {needPhoto && (
          <div className="mt-5">
            <Field label="부착 사진 증빙" hint="프로토타입: 실제 업로드 대신 예시 파일로 대체됩니다 (실개발 시 Supabase Storage).">
              {photo ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
                  <span className="w-12 h-12 rounded-lg bg-kakao-yellow/40 flex items-center justify-center text-xl">🖼</span>
                  <span className="text-sm text-ink-700">{photo}</span>
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setPhoto(null)}>제거</Button>
                </div>
              ) : (
                <button
                  onClick={() => setPhoto(`부착사진_${merchant?.name || "가맹점"}.jpg`)}
                  className="w-full rounded-xl border-2 border-dashed border-line py-8 text-sm text-ink-400 hover:border-kakao-yellowD hover:text-ink-600"
                >
                  + 부착 사진 업로드 (예시)
                </button>
              )}
            </Field>
          </div>
        )}

        {merchant && (
          <div className="mt-5">
            <Notice tone="yellow">
              지급 예정 금액 <b>{won(INCENTIVE_AMOUNT[type])}</b> — 유형 단가로 자동 산정됩니다 (수기 입력 없음).
            </Notice>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-7">
          <Button variant="ghost" onClick={() => router.push("/incentives/review")}>취소</Button>
          <Button variant="primary" disabled={!canSubmit} onClick={submit}>증빙 접수</Button>
        </div>
      </Card>
    </div>
  );
}
