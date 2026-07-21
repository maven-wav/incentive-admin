"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, PERSONAS } from "@/lib/store";

const NAV = [
  { href: "/", label: "대시보드", icon: "▦", show: () => true },
  { href: "/merchants/register", label: "가맹점 등록", icon: "＋", show: (p) => p.canRegister },
  { href: "/merchants", label: "등록내역", icon: "☰", show: () => true },
  { href: "/incentives/submit", label: "시책 접수", icon: "↥", show: (p) => p.canSubmitClaim },
  { href: "/incentives/review", label: "시책 검수", icon: "✓", show: (p) => p.canReviewClaim },
  { href: "/settlements", label: "지급/정산", icon: "₩", show: () => true },
];

export default function Shell({ children }) {
  const pathname = usePathname();
  const { persona, setPersonaKey, perms, toast, loading, loadError } = useStore();

  const roleTone =
    persona.role === "내부"
      ? "bg-kakao-ink text-white"
      : persona.role === "얼라이언스사"
      ? "bg-kakao-yellow text-kakao-ink"
      : "bg-emerald-500 text-white";

  return (
    <div className="min-h-screen flex">
      {/* 사이드바 */}
      <aside className="w-60 shrink-0 bg-white border-r border-line flex flex-col fixed inset-y-0 left-0">
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-kakao-yellow text-kakao-ink font-black text-sm">
              pay
            </span>
            <div>
              <div className="text-[13px] font-bold text-ink-900 leading-tight">시책 어드민</div>
              <div className="text-[10px] text-ink-400">Table Order Incentive</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.filter((n) => n.show(perms)).map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  active
                    ? "bg-kakao-yellow/25 text-ink-900 font-bold"
                    : "text-ink-500 hover:bg-canvas"
                }`}
              >
                <span className={`w-4 text-center ${active ? "text-kakao-ink" : "opacity-50"}`}>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-3 border-t border-line text-[10px] text-ink-400">
          프로토타입 · Supabase · 콰트로 Mock
        </div>
      </aside>

      {/* 본문 */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-line flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${roleTone}`}>{persona.role}</span>
            <span className="text-sm text-ink-500">{persona.label}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-ink-400">역할 전환 (데모)</span>
            <select
              value={persona.key}
              onChange={(e) => setPersonaKey(e.target.value)}
              className="text-sm rounded-xl border border-line px-3.5 py-2 bg-white outline-none focus:border-kakao-yellowD"
            >
              {PERSONAS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        <main className="flex-1 px-10 py-7 w-full">
          {loadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 max-w-2xl">
              <div className="font-bold text-rose-900">데이터를 불러오지 못했습니다</div>
              <p className="text-sm text-rose-700 mt-2 font-mono break-all">{loadError}</p>
              <p className="text-xs text-rose-600 mt-3 leading-relaxed">
                스키마 관련 오류(PGRST106)라면 Supabase 대시보드 → Settings → API →
                Exposed schemas 에 <b>incentive_admin</b> 이 추가되어 있는지 확인하세요.
              </p>
            </div>
          ) : loading ? (
            <div className="text-sm text-ink-400 py-20 text-center">불러오는 중…</div>
          ) : (
            children
          )}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-kakao-ink text-white text-sm px-5 py-3 rounded-xl shadow-pop">
          {toast}
        </div>
      )}
    </div>
  );
}
