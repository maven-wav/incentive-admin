"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { uploadProof, proofPublicUrl } from "@/lib/supabase";
import { Card, Field, Input, Select, Button, Notice, TypeTag } from "@/components/ui";
import {
  CLAIM_TYPES,
  INCENTIVE_AMOUNT,
  MERCHANT_STATUS,
  SUBMITTABLE_CLAIM_TYPES,
  PHOTO_CLAIM_TYPES,
  hasCid,
} from "@/lib/mockData";

const won = (n) => n.toLocaleString("ko-KR") + "원";
const thisMonth = "2026-07";

// 접수 가능한 3유형 카드 메타 (가맹모집은 가맹 등록 시 자동 생성되어 여기 없음)
const TYPE_META = {
  [CLAIM_TYPES.NONGAMAENG_TXN]: { emoji: "💳", desc: "비가맹 가맹점 결제건수 시책 — 대리점이 결제건수 입력, 담당자 검수" },
  [CLAIM_TYPES.ALLIANCE_QR]: { emoji: "🔗", desc: "얼라이언스 QR 20개 이상 부착 — 부착 사진 업로드" },
  [CLAIM_TYPES.PROMO]: { emoji: "📸", desc: "홍보물 부착 — 부착 사진 업로드, 담당자 육안 검수" },
};

export default function SubmitClaim() {
  const router = useRouter();
  const { perms, visibleMerchants, agencyById, submitClaim } = useStore();

  const [type, setType] = useState(SUBMITTABLE_CLAIM_TYPES[0]);

  // 비가맹결제건수는 비가맹 승인완료 가맹점만, QR·홍보물은 승인완료 전체가 대상.
  const approved = visibleMerchants.filter((m) => m.status === MERCHANT_STATUS.APPROVED);
  const targets =
    type === CLAIM_TYPES.NONGAMAENG_TXN ? approved.filter((m) => !hasCid(m.recruitType)) : approved;

  // 역할·유형을 바꾸면 대상 목록이 통째로 달라진다. 이전 선택이 목록에 없으면 첫 항목으로 되돌린다.
  const [pickedId, setPickedId] = useState("");
  const merchantId = targets.some((m) => m.id === pickedId) ? pickedId : targets[0]?.id || "";
  const [claimMonth, setClaimMonth] = useState(thisMonth);
  const [txnTotal, setTxnTotal] = useState("");
  // photo = Storage 저장 경로 (proof_photo에 그대로 들어간다)
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  // 드롭존 밖에 파일을 놓으면 브라우저가 그 파일로 이동해버려 작성 중이던 폼이 날아간다.
  useEffect(() => {
    const block = (e) => e.preventDefault();
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  if (!perms.canSubmitClaim) {
    return (
      <Card title="시책 접수">
        <Notice tone="warn">
          시책 접수(증빙 등록)는 <b>대리점</b> 권한에서만 가능합니다. 우측 상단에서 역할을 전환해 보세요.
        </Notice>
      </Card>
    );
  }

  const merchant = targets.find((m) => m.id === merchantId);
  const needPhoto = PHOTO_CLAIM_TYPES.includes(type);
  const isTxn = type === CLAIM_TYPES.NONGAMAENG_TXN;
  const canSubmit =
    merchant && (!needPhoto || photo) && (!isTxn || Number(txnTotal) > 0) && !uploading;

  // 파일 선택 · 드롭 공통 경로
  const handleFile = async (file) => {
    if (!file) return;
    // 드롭은 accept 필터가 걸리지 않으므로 직접 확인한다.
    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

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

  const pickPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 고를 수 있게 초기화
    handleFile(file);
  };

  const dropPhoto = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!uploading) handleFile(e.dataTransfer.files?.[0]);
  };

  // 중복 접수·DB 실패 시에는 화면을 옮기지 않는다. 옮겨버리면 실패 토스트만
  // 스치고 검수 목록으로 넘어가서 접수된 것처럼 보인다.
  const submit = async () => {
    if (!canSubmit) return;
    const created = await submitClaim({
      merchantId, agencyId: merchant.agencyId, type, claimMonth,
      proofPhoto: needPhoto ? photo : null,
      txnTotal: isTxn ? Number(txnTotal) : undefined,
    });
    if (created) router.push("/incentives/review");
  };

  return (
    <div className="space-y-7 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">시책 접수 (증빙 등록)</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          기 등록된 가맹점에 대해 시책을 접수합니다. 가맹모집은 가맹 등록 시 자동 접수되므로 여기서는 선택하지 않습니다.
        </p>
      </div>

      <Card title="① 시책 유형 분기" desc="비가맹결제건수 / 얼라이언스QR부착 / 홍보물부착">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SUBMITTABLE_CLAIM_TYPES.map((key) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`text-left rounded-2xl border p-5 transition ${
                type === key
                  ? "border-kakao-yellowD bg-kakao-yellow/15 ring-2 ring-kakao-yellow/40"
                  : "border-line bg-white hover:border-ink-300"
              }`}
            >
              <div className="text-2xl">{TYPE_META[key].emoji}</div>
              <div className="font-bold text-ink-900 mt-2 flex items-center gap-2">
                <TypeTag>{key}</TypeTag>
              </div>
              <div className="text-xs text-ink-500 mt-1.5 leading-relaxed">{TYPE_META[key].desc}</div>
              <div className="text-xs font-semibold text-ink-700 mt-2">단가 {won(INCENTIVE_AMOUNT[key])}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="② 대상 가맹점 & 증빙">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label={isTxn ? "가맹점 (비가맹 · 승인완료 건만)" : "가맹점 (승인완료 건만)"}>
            <Select value={merchantId} onChange={(e) => setPickedId(e.target.value)}>
              {targets.length === 0 && <option value="">대상 가맹점 없음</option>}
              {targets.map((m) => (
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

        {isTxn && (
          <div className="mt-5">
            <Field label="결제건수" hint="비가맹은 내부 확인이 불가해 대리점이 직접 입력합니다. 담당자가 검수 시 확인합니다.">
              <Input
                type="number"
                min="1"
                value={txnTotal}
                onChange={(e) => setTxnTotal(e.target.value)}
                placeholder="예) 12"
              />
            </Field>
          </div>
        )}

        {needPhoto && (
          <div className="mt-5">
            <Field
              label={type === CLAIM_TYPES.ALLIANCE_QR ? "얼라이언스 QR 부착 사진" : "부착 사진 증빙"}
              hint={
                type === CLAIM_TYPES.ALLIANCE_QR
                  ? "QR 20개 이상 부착 사진을 끌어다 놓거나 클릭해서 선택하면 Supabase Storage에 업로드됩니다."
                  : "이미지를 끌어다 놓거나 클릭해서 선택하면 Supabase Storage에 업로드됩니다."
              }
            >
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
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={dropPhoto}
                  className={`w-full rounded-xl border-2 border-dashed py-8 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    dragOver
                      ? "border-kakao-yellowD bg-kakao-yellow/15 text-ink-700"
                      : "border-line text-ink-400 hover:border-kakao-yellowD hover:text-ink-600"
                  }`}
                >
                  {uploading
                    ? "업로드 중…"
                    : dragOver
                    ? "여기에 놓으세요"
                    : "+ 부착 사진 — 끌어다 놓거나 클릭해서 선택"}
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
