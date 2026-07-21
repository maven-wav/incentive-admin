"use client";

import { MERCHANT_STATUS, CLAIM_STATUS } from "@/lib/mockData";

export function Card({ title, desc, right, children, className = "" }) {
  return (
    <section className={`bg-white rounded-2xl border border-line shadow-card ${className}`}>
      {(title || right) && (
        <header className="flex items-start justify-between gap-3 px-6 py-4 border-b border-line">
          <div>
            {title && <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>}
            {desc && <p className="text-xs text-ink-500 mt-1">{desc}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="p-6">{children}</div>
    </section>
  );
}

export function Button({ children, variant = "primary", size = "md", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100";
  const sizes = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2.5" };
  const variants = {
    primary: "bg-kakao-yellow text-kakao-ink hover:bg-kakao-yellowD shadow-sm", // 카카오 옐로우 CTA
    dark: "bg-kakao-ink text-white hover:bg-black",
    ghost: "bg-white text-ink-700 border border-line hover:bg-canvas",
    danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
    approve: "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}

const statusColor = {
  [MERCHANT_STATUS.PENDING]: "bg-blue-50 text-blue-600 border-blue-100",
  [MERCHANT_STATUS.APPROVED]: "bg-emerald-50 text-emerald-600 border-emerald-100",
  [MERCHANT_STATUS.REJECTED]: "bg-red-50 text-red-500 border-red-100",
  [CLAIM_STATUS.REVIEW]: "bg-blue-50 text-blue-600 border-blue-100",
  [CLAIM_STATUS.WAIT]: "bg-violet-50 text-violet-600 border-violet-100",
  [CLAIM_STATUS.PAID]: "bg-emerald-50 text-emerald-600 border-emerald-100",
  [CLAIM_STATUS.REJECTED]: "bg-red-50 text-red-500 border-red-100",
};

export function Pill({ children }) {
  const cls = statusColor[children] || "bg-slate-50 text-ink-500 border-line";
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-lg border ${cls}`}>
      {children}
    </span>
  );
}

export function TypeTag({ children }) {
  const map = {
    가맹모집: "bg-amber-50 text-amber-700 border-amber-100",
    홍보물부착: "bg-sky-50 text-sky-700 border-sky-100",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md border ${map[children] || "bg-slate-50 text-ink-500 border-line"}`}>
      {children}
    </span>
  );
}

export function YN({ value }) {
  if (value === null || value === undefined) return <span className="text-ink-400">—</span>;
  return value ? (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">Y</span>
  ) : (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-400 text-white text-xs font-bold">N</span>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ink-400 mt-1.5">{hint}</span>}
    </label>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-kakao-yellowD focus:ring-2 focus:ring-kakao-yellow/40 ${props.className || ""}`}
    />
  );
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-white outline-none focus:border-kakao-yellowD focus:ring-2 focus:ring-kakao-yellow/40 ${props.className || ""}`}
    >
      {children}
    </select>
  );
}

export function Th({ children, className = "" }) {
  return (
    <th className={`text-left text-xs font-semibold text-ink-500 px-3 py-3 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }) {
  return <td className={`px-3 py-3 text-sm text-ink-700 align-middle ${className}`}>{children}</td>;
}

export function EmptyRow({ colSpan, text = "데이터가 없습니다." }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-14 text-center text-sm text-ink-400">
        {text}
      </td>
    </tr>
  );
}

export function Notice({ children, tone = "info" }) {
  const tones = {
    info: "bg-blue-50 text-blue-700 border-blue-100",
    warn: "bg-amber-50 text-amber-800 border-amber-100",
    yellow: "bg-kakao-yellow/20 text-ink-800 border-kakao-yellow/40",
  };
  return <div className={`text-xs rounded-xl border px-3.5 py-2.5 ${tones[tone]}`}>{children}</div>;
}
