"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { onAuthChange } from "@/lib/firebase/auth";
import { ensureTrialForUser, type TrialInfo, toDate } from "@/lib/subscription/trial";
import {
  formatBytes,
  formatNumber,
  getPlanDefinition,
  getPlanLimits,
  normalizeUsage,
  usagePercent,
  type PlanDefinition,
  type UsageCounters,
} from "@/lib/subscription/plans";

interface RecentDocument {
  id: string;
  title: string;
  meta: string;
  sizeBytes: number;
  createdAtMs: number;
}

const EMPTY_USAGE: UsageCounters = {
  documentCount: 0,
  storageBytesUsed: 0,
  aiTokensUsedMonth: 0,
  aiRequestsMonth: 0,
};

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("Usuario");
  const [loading, setLoading] = useState(true);
  const [trial, setTrial] = useState<TrialInfo | null>(null);
  const [plan, setPlan] = useState<PlanDefinition>(() => getPlanDefinition("free_trial"));
  const [usage, setUsage] = useState<UsageCounters>(EMPTY_USAGE);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);

  useEffect(() => {
    let alive = true;

    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setDisplayName(user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "Usuario");

      try {
        const [trialInfo, profileSnap, docsSnap] = await Promise.all([
          ensureTrialForUser(user.uid).catch(() => null),
          getDoc(doc(db, "users", user.uid)),
          getDocs(collection(db, "users", user.uid, "documents")),
        ]);

        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const planDefinition = getPlanDefinition(profile.plan ?? trialInfo?.plan ?? "free_trial");
        const storedUsage = normalizeUsage(profile.usage);
        const documents = docsSnap.docs.map((snapshot) => {
          const data = snapshot.data();
          const sizeBytes = Number(data.fileSizeBytes ?? data.fileSize ?? data.size ?? 0);
          const createdAt = toDate(data.createdAt);
          const type = data.docType || data.category || data.fileType || "Documento";
          return {
            id: snapshot.id,
            title: String(data.title || data.fileName || type),
            meta: `${String(type)} · ${createdAt ? formatShortDate(createdAt) : "Sin fecha"}`,
            sizeBytes,
            createdAtMs: createdAt?.getTime() ?? 0,
          };
        });

        const measuredUsage = {
          ...storedUsage,
          documentCount: Math.max(storedUsage.documentCount, documents.length),
          storageBytesUsed: Math.max(
            storedUsage.storageBytesUsed,
            documents.reduce((sum, item) => sum + item.sizeBytes, 0),
          ),
        };

        await setDoc(doc(db, "users", user.uid), {
          usage: measuredUsage,
          limits: getPlanLimits(planDefinition.id),
          updatedAt: serverTimestamp(),
        }, { merge: true }).catch(() => undefined);

        if (!alive) return;
        setTrial(trialInfo);
        setPlan(planDefinition);
        setUsage(measuredUsage);
        setRecentDocs(documents.sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 3));
      } finally {
        if (alive) setLoading(false);
      }
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const storageRemaining = Math.max(0, plan.maxStorageBytes - usage.storageBytesUsed);
  const documentsRemaining = Math.max(0, plan.maxDocuments - usage.documentCount);
  const storagePercent = usagePercent(usage.storageBytesUsed, plan.maxStorageBytes);
  const documentPercent = usagePercent(usage.documentCount, plan.maxDocuments);
  const aiPercent = usagePercent(usage.aiTokensUsedMonth, plan.maxAiTokensMonth);

  const trialSubtitle = useMemo(() => {
    if (!trial) return "Tu plan inicial queda listo para medir documentos, almacenamiento e IA.";
    if (trial.status === "trial") return `Te quedan ${trial.daysRemaining} dias de prueba gratuita.`;
    if (trial.status === "trial_expired") return "Tu prueba gratuita finalizo. Puedes activar un plan pago.";
    return "Tu suscripcion esta activa.";
  }, [trial]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-12">
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-[#13696a]">MiSalud FamilIA</p>
        <h2
          className="text-2xl font-bold text-[#003A7A] md:text-[32px]"
          style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}
        >
          Hola, {displayName}.
        </h2>
        <p className="text-lg text-[#43474e]">Este es tu centro medico familiar.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[rgba(196,198,207,0.3)] bg-white p-5 shadow-[0px_4px_20px_rgba(26,54,93,0.08)] lg:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#003A7A]">Plan actual</p>
              <h3 className="mt-1 text-2xl font-bold text-[#003A7A]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                {plan.label}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-[#43474e]">{trialSubtitle}</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#d7f5f1] px-3 py-1 text-xs font-bold text-[#13696a]">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {plan.priceLabel}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <UsageMeter
              icon="description"
              label="Documentos"
              value={`${formatNumber(usage.documentCount)} / ${formatNumber(plan.maxDocuments)}`}
              helper={`Quedan ${formatNumber(documentsRemaining)} documentos`}
              percent={documentPercent}
            />
            <UsageMeter
              icon="database"
              label="Almacenamiento"
              value={`${formatBytes(usage.storageBytesUsed)} / ${formatBytes(plan.maxStorageBytes)}`}
              helper={`Quedan ${formatBytes(storageRemaining)}`}
              percent={storagePercent}
            />
            <UsageMeter
              icon="auto_awesome"
              label="IA mensual"
              value={`${formatNumber(usage.aiTokensUsedMonth)} tokens`}
              helper={`${formatNumber(usage.aiRequestsMonth)} solicitudes registradas`}
              percent={aiPercent}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-[#003A7A] p-5 text-white shadow-[0px_4px_20px_rgba(26,54,93,0.14)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">calendar_month</span>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Prueba gratuita</p>
          </div>
          <p className="mt-4 text-3xl font-bold">{trial?.daysRemaining ?? 30}</p>
          <p className="text-sm text-[#c7f4ef]">dias restantes</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-[#00B8A9]" style={{ width: `${trial?.progress ?? 0}%` }} />
          </div>
          <p className="mt-3 text-xs text-white/75">
            Inicio: {trial ? formatShortDate(trial.startedAt) : "pendiente"} · Fin: {trial ? formatShortDate(trial.endsAt) : "pendiente"}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <section className="rounded-2xl border border-[rgba(196,198,207,0.3)] bg-white p-4 shadow-[0px_4px_20px_rgba(26,54,93,0.08)] md:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#003A7A]">Personas a mi cargo</h3>
            <Link href="/personas" className="text-xs font-semibold text-[#00B8A9] hover:underline">Ver todos</Link>
          </div>
          <EmptyState
            icon="group_add"
            title="Agrega tu primera persona"
            text="Registra familiares o personas a cargo para organizar sus documentos medicos."
            actionHref="/personas/nueva"
            actionLabel="Agregar persona"
          />
        </section>

        <section className="rounded-2xl border border-[#00B8A9] bg-white p-4 shadow-[0px_4px_20px_rgba(26,54,93,0.08)] md:col-span-4">
          <div className="mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00B8A9]">auto_awesome</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#003A7A]">IA responsable</h3>
          </div>
          <p className="text-sm leading-relaxed text-[#43474e]">
            Cuando subas documentos, la IA podra generar resumenes y alertas informativas. El consumo quedara registrado en tu plan.
          </p>
          <Link href="/boveda/subir" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#00B8A9] px-4 py-2 text-sm font-semibold text-white">
            Subir documento
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
          </Link>
        </section>

        <section className="space-y-4 md:col-span-7">
          <div className="rounded-2xl border border-[rgba(196,198,207,0.3)] bg-white p-4 shadow-[0px_4px_20px_rgba(26,54,93,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#003A7A]">Documentos recientes</h3>
              <span className="material-symbols-outlined text-[#43474e]">folder_open</span>
            </div>
            {loading ? (
              <p className="text-sm text-[#43474e]">Cargando documentos...</p>
            ) : recentDocs.length > 0 ? (
              <ul className="space-y-2">
                {recentDocs.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-xl bg-[#f7fafc] p-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="material-symbols-outlined text-[#00B8A9]">description</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#003A7A]">{item.title}</p>
                        <p className="text-xs text-[#43474e]">{item.meta} · {formatBytes(item.sizeBytes)}</p>
                      </div>
                    </div>
                    <Link href={`/boveda/${item.id}`} className="rounded-lg p-2 text-[#74777f] hover:bg-[#ebeef0]">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="upload_file"
                title="Aun no tienes documentos"
                text="Sube historias clinicas, formulas, examenes o autorizaciones para empezar tu boveda."
                actionHref="/boveda/subir"
                actionLabel="Subir documento"
              />
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(196,198,207,0.3)] bg-white p-4 shadow-[0px_4px_20px_rgba(26,54,93,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#003A7A]">Examenes con cambios</h3>
              <span className="material-symbols-outlined text-[#13696a]">monitoring</span>
            </div>
            <EmptyState
              icon="science"
              title="Sin cambios detectados"
              text="Cuando la IA encuentre variaciones relevantes en examenes, apareceran aqui."
              actionHref="/boveda"
              actionLabel="Ver boveda"
            />
          </div>
        </section>

        <section className="space-y-4 md:col-span-5">
          <Link
            href="/emergencia"
            className="flex w-full items-center justify-between rounded-2xl p-4 text-white shadow-[0_4px_12px_rgba(186,26,26,0.3)] active:scale-[0.98]"
            style={{ backgroundColor: "#ba1a1a" }}
          >
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl">emergency</span>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">Resumen de emergencia</h3>
                <p className="text-sm opacity-90">Disponible cuando registres datos familiares.</p>
              </div>
            </div>
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>

          <div className="rounded-2xl border border-[rgba(196,198,207,0.3)] bg-white p-4 shadow-[0px_4px_20px_rgba(26,54,93,0.08)]">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#003A7A]">Actividad reciente</h3>
            <EmptyState
              icon="history"
              title="Sin actividad todavia"
              text="Las cargas, resumenes y cambios importantes apareceran en esta linea de tiempo."
              actionHref="/boveda/subir"
              actionLabel="Crear actividad"
            />
          </div>
        </section>
      </div>

      <section className="py-2">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#003A7A]">Acciones rapidas</h3>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {[
            { icon: "upload_file", label: "Subir doc.", href: "/boveda/subir" },
            { icon: "person_add", label: "Agregar pers.", href: "/personas/nueva" },
            { icon: "summarize", label: "Resumen", href: "/boveda" },
            { icon: "auto_awesome", label: "Preguntar IA", href: "/boveda" },
            { icon: "share", label: "Compartir", href: "/boveda" },
          ].map((action) => (
            <Link key={action.label} href={action.href} className="group flex flex-shrink-0 flex-col items-center gap-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A5EDE8] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-2xl text-[#003A7A]">{action.icon}</span>
              </div>
              <span className="whitespace-nowrap text-xs font-semibold text-[#003A7A]">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex justify-center py-4 opacity-70">
        <div className="flex items-center gap-2 rounded-full bg-[#d7f5f1] px-4 py-2">
          <span className="material-symbols-outlined text-[16px] text-[#003A7A]">lock</span>
          <span className="text-xs font-bold uppercase tracking-widest text-[#003A7A]">
            Tus datos estan protegidos con grado medico
          </span>
        </div>
      </div>
    </div>
  );
}

function UsageMeter({ icon, label, value, helper, percent }: { icon: string; label: string; value: string; helper: string; percent: number }) {
  const barColor = percent >= 90 ? "#ba1a1a" : percent >= 75 ? "#b26a00" : "#00B8A9";

  return (
    <div className="rounded-xl border border-[#dfe3e8] bg-[#f7fafc] p-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#13696a]">{icon}</span>
        <p className="text-xs font-bold uppercase tracking-wider text-[#43474e]">{label}</p>
      </div>
      <p className="mt-3 text-lg font-bold text-[#003A7A]">{value}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e0e3e5]">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: barColor }} />
      </div>
      <p className="mt-2 text-xs text-[#43474e]">{helper}</p>
    </div>
  );
}

function EmptyState({ icon, title, text, actionHref, actionLabel }: { icon: string; title: string; text: string; actionHref: string; actionLabel: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#c4c6cf] bg-[#f7fafc] p-5 text-center">
      <span className="material-symbols-outlined text-4xl text-[#00B8A9]">{icon}</span>
      <p className="mt-2 text-sm font-bold text-[#003A7A]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#43474e]">{text}</p>
      <Link href={actionHref} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#003A7A] px-4 py-2 text-sm font-semibold text-white">
        {actionLabel}
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </Link>
    </div>
  );
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
