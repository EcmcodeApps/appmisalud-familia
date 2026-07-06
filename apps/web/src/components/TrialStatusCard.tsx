"use client";

import Link from "next/link";
import { formatTrialDate, TRIAL_DAYS, type TrialInfo } from "@/lib/subscription/trial";

export function TrialStatusCard({ trial, compact = false }: { trial: TrialInfo; compact?: boolean }) {
  const expired = trial.isExpired;
  const title = expired ? "Tu prueba gratuita finalizó" : `Te quedan ${trial.daysRemaining} días`;
  const subtitle = expired
    ? "Activa el plan económico para seguir usando IA, OCR y carga de documentos."
    : `Día ${trial.daysUsed} de ${TRIAL_DAYS} de tu prueba gratuita.`;

  return (
    <section
      className={`rounded-2xl border p-4 ${compact ? "space-y-3" : "space-y-4"}`}
      style={{
        backgroundColor: expired ? "#ffdad6" : "#ffffff",
        borderColor: expired ? "#ba1a1a" : "rgba(196,198,207,0.3)",
        boxShadow: "0px 4px 20px rgba(26,54,93,0.08)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: expired ? "rgba(186,26,26,0.12)" : "rgba(162,237,237,0.35)" }}
        >
          <span className="material-symbols-outlined text-[#13696a]">
            {expired ? "lock" : "calendar_month"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#43474e]">Prueba gratuita</p>
          <h3 className="text-lg font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            {title}
          </h3>
          <p className="text-sm text-[#43474e]">{subtitle}</p>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#e0e3e5]">
        <div
          className="h-full rounded-full"
          style={{ width: `${trial.progress}%`, backgroundColor: expired ? "#ba1a1a" : "#13696a" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-[#f7fafc] p-3">
          <p className="text-xs text-[#74777f]">Inicio</p>
          <p className="font-semibold text-[#002045]">{formatTrialDate(trial.startedAt)}</p>
        </div>
        <div className="rounded-xl bg-[#f7fafc] p-3">
          <p className="text-xs text-[#74777f]">Finaliza</p>
          <p className="font-semibold text-[#002045]">{formatTrialDate(trial.endsAt)}</p>
        </div>
      </div>

      {expired && (
        <Link
          href="/ajustes"
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#002045] px-4 text-sm font-semibold text-white active:scale-[0.98]"
        >
          Activar plan económico
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      )}
    </section>
  );
}

export function TrialExpiredNotice({ trial }: { trial: TrialInfo | null }) {
  if (!trial?.isExpired) return null;

  return (
    <div className="rounded-2xl border border-[#ba1a1a] bg-[#ffdad6] p-4 text-[#93000a]">
      <div className="flex gap-3">
        <span className="material-symbols-outlined shrink-0">lock</span>
        <div>
          <p className="font-bold">Tu prueba gratuita terminó el {formatTrialDate(trial.endsAt)}.</p>
          <p className="text-sm">Puedes seguir entrando a tu cuenta. Para usar funciones premium, activa el plan económico.</p>
        </div>
      </div>
    </div>
  );
}
