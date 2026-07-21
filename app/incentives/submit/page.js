"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { uploadProof, proofPublicUrl } from "@/lib/supabase";
import { Card, Field, Select, Button, Notice, TypeTag } from "@/components/ui";
import { CLAIM_TYPES, INCENTIVE_AMOUNT, MERCHANT_STATUS, TXN_TOTAL_CRITERIA } from "@/lib/mockData";

const won = (n) => n.toLocaleString("ko-KR") + "원";
const thisMonth = "2026-07";

export default function SubmitClaim() {
  const router = useRouter();
  const { persona, perms, visibleMerchants, agencyById, submitClaim } = useStore();

  const approved = visibleMerchants.filter((m) => m.status === MERCHANT_STATUS.APPROVED);
  const [type, setType] = useState(CLAIM_TYPES.RECRUIT);
  const [merchantId, setMerchantId] = useState(approved[0]?.id || "");
  const [claimMonth, setClaimMonth] = useState(thisMonth);
  // photo = Storage 저장 경로 (proof_photo에 그대로 들어간다)
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileRef = useRef(null);

  if (!perms.canSubmitClaim) {
    return (
      <Card title="시책 접수">
        <Notice tone="warn">
          시책 접수(증빙 등록)는 <b>얼라이언스사</b> 권한에서만 가능합니다. 우측 상단에서 역할을 전환해 보세요.
        </Notice>
      </Card>
    );
  }

  const merchant = approved.find((m) => m.id === merchantId);
  const needPhoto = type === CLAIM_TYPES.PROMO;
  const canSubmit = merchant && (!needPhoto || photo) && !uploading;

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 고를 수 있게 초기화
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      setPhoto(await uploadProof(file));
    } catch (err) {
      console.error("[부착 사진 업로드]", err);
      setUploadError(err.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

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
            { key: CLAIM_TYPES.RECRUIT, emoji: "🤝", desc: `가맹 연결 — 결제검수(가맹·활성화·3개월 총 ${TXN_TOTAL_CRITERIA}건)로 자동 판정` },
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
            <Field label="부착 사진 증빙" hint="이미지 파일을 선택하면 Supabase Storage에 업로드됩니다.">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
              {photo ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
                  <img
                    src={proofPublicUrl(photo)}
                    alt="부착 사진 미리보기"
                    className="w-16 h-16 rounded-lg object-cover border border-line bg-white shrink-0"
                  />
                  <span className="text-sm text-ink-700 break-all">{photo}</span>
                  <Button size="sm" variant="ghost" className="ml-auto shrink-0" onClick={() => setPhoto(null)}>제거</Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-line py-8 text-sm text-ink-400 hover:border-kakao-yellowD hover:text-ink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? "업로드 중…" : "+ 부착 사진 업로드"}
                </button>
              )}
              {uploadError && (
                <div className="mt-2">
                  <Notice tone="warn">업로드 실패 — {uploadError}</Notice>
                </div>
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
