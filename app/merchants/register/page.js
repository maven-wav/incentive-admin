"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, Field, Input, Select, Button, Notice } from "@/components/ui";
import { STORE_TYPES, RECRUIT_TYPES } from "@/lib/mockData";
import { inspectCid } from "@/lib/cid";

const STEPS = ["유형구분", "정보기재", "저장", "담당자 승인", "등록완료"];

export default function RegisterMerchant() {
  const router = useRouter();
  const { persona, perms, agencies, allianceById, registerMerchant } = useStore();

  // VAN 대리점은 공용 풀이라 얼라이언스와 무관하게 전부 선택 가능하다.
  // 얼라이언스는 로그인한 페르소나로 고정된다.
  const alliance = allianceById(persona.scopeId);

  const [form, setForm] = useState({
    storeType: STORE_TYPES[0],
    name: "",
    bizNo: "",
    cid: "",
    recruitType: RECRUIT_TYPES[0],
    agencyId: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const cidCheck = inspectCid(form.cid);

  if (!perms.canRegister) {
    return (
      <Card title="가맹점 등록">
        <Notice tone="warn">
          가맹점 등록은 <b>얼라이언스사</b> 권한에서만 가능합니다. 우측 상단에서 역할을 전환해 보세요.
        </Notice>
      </Card>
    );
  }

  const canSave = form.name && form.bizNo && form.agencyId && cidCheck.ok;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    // 등록 실패 시 목록으로 넘기면 방금 만든 가맹점이 없어 혼란스럽다.
    const created = await registerMerchant({ ...form, allianceId: persona.scopeId });
    if (created) router.push("/merchants");
  };

  return (
    <div className="space-y-7 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">가맹점 신규 등록</h1>
        <p className="text-sm text-ink-500 mt-1.5">테이블주문 신규 가맹점을 등록합니다.</p>
      </div>

      {/* 진행 단계 */}
      <div className="flex items-center gap-1.5 text-xs">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className={`px-3 py-1.5 rounded-full font-semibold ${
                i <= 2 ? "bg-kakao-yellow text-kakao-ink" : "bg-white border border-line text-ink-400"
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="text-ink-300">›</span>}
          </div>
        ))}
      </div>

      <form onSubmit={submit}>
        <Card title="① 유형 구분">
          <div className="flex gap-3">
            {STORE_TYPES.map((t) => (
              <label
                key={t}
                className={`flex-1 cursor-pointer rounded-xl border px-4 py-3.5 text-sm text-center font-medium transition ${
                  form.storeType === t
                    ? "border-kakao-yellowD bg-kakao-yellow/20 text-ink-900"
                    : "border-line text-ink-500 hover:border-ink-300"
                }`}
              >
                <input type="radio" name="storeType" className="hidden" checked={form.storeType === t} onChange={() => setForm((f) => ({ ...f, storeType: t }))} />
                {t}
              </label>
            ))}
          </div>
        </Card>

        <Card title="② 정보 기재" className="mt-5">
          <div className="grid md:grid-cols-2 gap-5">
            <Field label="가맹점명">
              <Input value={form.name} onChange={set("name")} placeholder="예) 행복분식 강남점" />
            </Field>
            <Field label="사업자등록번호">
              <Input value={form.bizNo} onChange={set("bizNo")} placeholder="000-00-00000" />
            </Field>
            <Field label="CID (선택)" hint="입력 시 사업자등록 기준 내부 DB 조회로 자동 매핑 · 없으면 빈칸">
              <Input value={form.cid} onChange={set("cid")} placeholder="예) CQP05FGZM6SCRX6" />
              {form.cid && cidCheck.warning && (
                <div className="mt-2">
                  <Notice tone="warn">⚠️ {cidCheck.warning}</Notice>
                </div>
              )}
            </Field>
            <Field label="모집유형">
              <Select value={form.recruitType} onChange={set("recruitType")}>
                {RECRUIT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="대리점명" hint="VAN 대리점은 공용 풀에서 자유롭게 선택합니다.">
              <Select value={form.agencyId} onChange={set("agencyId")}>
                <option value="">대리점을 선택하세요</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="얼라이언스 (자동)" hint="로그인한 얼라이언스사로 지정됩니다">
              <Input value={alliance?.name || "—"} disabled className="bg-canvas text-ink-500" />
            </Field>
          </div>

          <div className="flex justify-end gap-2 mt-7">
            <Button type="button" variant="ghost" onClick={() => router.push("/merchants")}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={!canSave}>
              저장 · 등록 신청
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
