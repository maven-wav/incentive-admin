"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, Field, Input, Select, Button, Notice } from "@/components/ui";
import { STORE_TYPES, RECRUIT_TYPES, hasCid } from "@/lib/mockData";
import { inspectCid } from "@/lib/cid";
import { SAMPLE_MERCHANTS, lookupByBizNo } from "@/lib/sampleMerchants";

const STEPS = ["모집유형", "정보기재", "저장", "담당자 승인", "등록완료"];

// 테스트 어드민용: 미등록 사업자번호를 골라 CID·가맹점명을 폼에 채운다.
function SampleMerchantModal({ registeredCids, onPick, onClose }) {
  return (
    <div className="fixed inset-0 z-40 bg-ink-900/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-pop w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <header className="px-6 py-4 border-b border-line">
          <h3 className="font-bold text-ink-900">샘플 가맹점 올리기</h3>
          <p className="text-xs text-ink-500 mt-1">미등록 사업자번호를 선택하면 CID·가맹점명이 자동 입력됩니다. (테스트용)</p>
        </header>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {SAMPLE_MERCHANTS.map((s) => (
            <div key={s.bizNo}>
              <div className="text-xs font-semibold text-ink-700 mb-1.5">{s.bizNo}</div>
              <div className="space-y-1">
                {s.stores.map((st) => {
                  const used = registeredCids.has(st.cid);
                  return (
                    <button
                      key={st.cid}
                      type="button"
                      disabled={used}
                      onClick={() => onPick({ bizNo: s.bizNo, cid: st.cid, name: st.name })}
                      className="w-full flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm text-left hover:border-kakao-yellowD disabled:opacity-40"
                    >
                      <span>{st.name} <span className="font-mono text-xs text-ink-400">{st.cid}</span></span>
                      {used && <span className="text-[10px] text-ink-400">등록됨</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <footer className="px-6 py-4 border-t border-line flex justify-end">
          <Button variant="ghost" onClick={onClose}>닫기</Button>
        </footer>
      </div>
    </div>
  );
}

export default function RegisterMerchant() {
  const router = useRouter();
  const { persona, perms, alliances, agencyById, merchants, registerMerchant } = useStore();

  // 로그인한 VAN 대리점 (자동). 얼라이언스는 폼에서 선택한다.
  const agency = agencyById(persona.scopeId);

  const [form, setForm] = useState({
    storeType: STORE_TYPES[0],
    recruitType: RECRUIT_TYPES[0],
    name: "",
    bizNo: "",
    cid: "",
    allianceId: "",
  });
  const [showSample, setShowSample] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isCidType = hasCid(form.recruitType);
  const cidCheck = inspectCid(form.cid);

  // 모집유형이 바뀌면 조회 상태(cid/가맹점명)를 초기화한다.
  const setRecruitType = (t) => setForm((f) => ({ ...f, recruitType: t, cid: "", name: "" }));

  // 사업자번호(10자리)로 CID 후보 조회 — 샘플 풀 + 기존 등록건에서 찾는다.
  const bizDigits = form.bizNo.replace(/\D/g, "");
  const candidates = useMemo(() => {
    if (!isCidType || bizDigits.length < 10) return [];
    const fromSample = lookupByBizNo(bizDigits);
    const fromMerchants = merchants
      .filter((m) => m.cid && m.bizNo && m.bizNo.replace(/\D/g, "") === bizDigits)
      .map((m) => ({ cid: m.cid, name: m.name }));
    const seen = new Set();
    return [...fromSample, ...fromMerchants].filter((c) => {
      if (seen.has(c.cid)) return false;
      seen.add(c.cid);
      return true;
    });
  }, [isCidType, bizDigits, merchants]);

  // 1건이면 자동 채움, 0건이면 이전 조회 결과를 비운다. N건이면 드롭다운으로 고른다.
  useEffect(() => {
    if (!isCidType) return;
    if (candidates.length === 1) {
      const only = candidates[0];
      setForm((f) => (f.cid === only.cid ? f : { ...f, cid: only.cid, name: only.name }));
    } else if (candidates.length === 0) {
      setForm((f) => (f.cid || f.name ? { ...f, cid: "", name: "" } : f));
    }
  }, [isCidType, candidates]);

  if (!perms.canRegister) {
    return (
      <Card title="가맹점 등록">
        <Notice tone="warn">
          가맹점 등록은 <b>대리점</b> 권한에서만 가능합니다. 우측 상단에서 역할을 전환해 보세요.
        </Notice>
      </Card>
    );
  }

  const registeredCids = new Set(merchants.map((m) => m.cid).filter(Boolean));
  const canSave =
    form.name && form.bizNo && form.allianceId && (isCidType ? !!form.cid : true);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    // 등록 실패 시 목록으로 넘기면 방금 만든 가맹점이 없어 혼란스럽다.
    const created = await registerMerchant({ ...form, agencyId: persona.scopeId });
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
        <Card title="① 모집유형" desc="가맹 계열은 사업자번호로 CID를 자동 조회합니다. 비가맹 계열은 CID가 없습니다.">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {RECRUIT_TYPES.map((t) => (
              <label
                key={t}
                className={`cursor-pointer rounded-xl border px-4 py-3 text-sm text-center font-medium transition ${
                  form.recruitType === t
                    ? "border-kakao-yellowD bg-kakao-yellow/20 text-ink-900"
                    : "border-line text-ink-500 hover:border-ink-300"
                }`}
              >
                <input type="radio" name="recruitType" className="hidden" checked={form.recruitType === t} onChange={() => setRecruitType(t)} />
                {t}
                <span className="block text-[10px] text-ink-400 mt-0.5">{hasCid(t) ? "CID 자동조회" : "CID 없음"}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card title="② 정보 기재" className="mt-5">
          <div className="mb-5">
            <span className="block text-xs font-semibold text-ink-700 mb-1.5">가맹점 유형</span>
            <div className="flex gap-3">
              {STORE_TYPES.map((t) => (
                <label
                  key={t}
                  className={`flex-1 cursor-pointer rounded-xl border px-4 py-3 text-sm text-center font-medium transition ${
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
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="사업자등록번호" hint={isCidType ? "10자리를 입력하면 CID·가맹점명이 자동 조회됩니다." : undefined}>
              {isCidType ? (
                <div className="flex gap-2">
                  <Input value={form.bizNo} onChange={set("bizNo")} placeholder="000-00-00000" className="flex-1" />
                  <Button type="button" variant="ghost" className="shrink-0" onClick={() => setShowSample(true)}>
                    샘플 가맹점 올리기
                  </Button>
                </div>
              ) : (
                <Input value={form.bizNo} onChange={set("bizNo")} placeholder="000-00-00000" />
              )}
            </Field>

            {isCidType ? (
              <>
                {candidates.length > 1 && (
                  <Field label="CID 선택" hint="이 사업자번호에 CID가 여러 개입니다. 고르면 가맹점명이 확정됩니다.">
                    <Select
                      value={form.cid}
                      onChange={(e) => {
                        const picked = candidates.find((c) => c.cid === e.target.value);
                        setForm((f) => ({ ...f, cid: picked?.cid || "", name: picked?.name || "" }));
                      }}
                    >
                      <option value="">CID를 선택하세요</option>
                      {candidates.map((c) => (
                        <option key={c.cid} value={c.cid}>
                          {c.cid} — {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                <Field label="CID (자동)" hint="사업자번호 조회 결과로 채워집니다.">
                  <Input value={form.cid} disabled placeholder="사업자번호 조회 시 자동" className="bg-canvas text-ink-500" />
                  {form.cid && cidCheck.warning && (
                    <div className="mt-2">
                      <Notice tone="warn">⚠️ {cidCheck.warning}</Notice>
                    </div>
                  )}
                </Field>
                <Field label="가맹점명 (자동)" hint="CID에 매핑된 가맹점명이 채워집니다.">
                  <Input value={form.name} disabled placeholder="사업자번호 조회 시 자동" className="bg-canvas text-ink-500" />
                </Field>
              </>
            ) : (
              <Field label="가맹점명">
                <Input value={form.name} onChange={set("name")} placeholder="예) 행복분식 강남점" />
              </Field>
            )}

            <Field label="얼라이언스" hint="증빙을 제출할 얼라이언스사를 선택합니다.">
              <Select value={form.allianceId} onChange={set("allianceId")}>
                <option value="">얼라이언스를 선택하세요</option>
                {alliances.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="대리점 (자동)" hint="로그인한 VAN 대리점으로 지정됩니다">
              <Input value={agency?.name || "—"} disabled className="bg-canvas text-ink-500" />
            </Field>
          </div>

          {isCidType && bizDigits.length >= 10 && candidates.length === 0 && (
            <div className="mt-4">
              <Notice tone="warn">
                해당 사업자번호로 조회된 CID가 없습니다 — [샘플 가맹점 올리기]로 등록하거나 사업자번호를 확인하세요.
              </Notice>
            </div>
          )}

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

      {showSample && (
        <SampleMerchantModal
          registeredCids={registeredCids}
          onPick={({ bizNo, cid, name }) => {
            setForm((f) => ({ ...f, bizNo, cid, name }));
            setShowSample(false);
          }}
          onClose={() => setShowSample(false)}
        />
      )}
    </div>
  );
}
