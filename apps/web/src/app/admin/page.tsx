"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { getIdTokenResult } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { onAuthChange } from "@/lib/firebase/auth";
import {
  updateAdminSubscription,
  type AdminPlanId,
  type AdminSubscriptionStatus,
  type AdminSubscriptionUpdateResponse,
} from "@/lib/api/client";
import { formatBytes, getPlanDefinition } from "@/lib/subscription/plans";

const adminNav = [
  { icon: "dashboard", label: "Dashboard", active: true },
  { icon: "group", label: "Usuarios" },
  { icon: "card_giftcard", label: "Pruebas gratuitas" },
  { icon: "subscriptions", label: "Suscripciones" },
  { icon: "auto_awesome", label: "Consumo IA" },
  { icon: "notifications_active", label: "Alertas", badge: "4" },
  { icon: "settings", label: "Configuración" },
];

const kpis = [
  { icon: "group", label: "Usuarios registrados", value: "128", delta: "+12%", color: "#002045" },
  { icon: "description", label: "Documentos guardados", value: "1.840", delta: "Total", color: "#13696a" },
  { icon: "database", label: "Storage estimado", value: "42.6 GB", delta: "Firebase", color: "#133a4a" },
  { icon: "warning", label: "Cerca del limite", value: "9", delta: "Usuarios", color: "#ba1a1a" },
  { icon: "auto_awesome", label: "Tokens IA", value: "1.2M", delta: "+28%", color: "#1a365d" },
  { icon: "monetization_on", label: "Costo variable", value: "US$21.22", delta: "Mes", color: "#1a6d6e" },
];

const planBreakdown = [
  { plan: "Prueba gratuita", users: 46, documents: 720, storage: "14.2 GB", percent: 36, color: "#13696a" },
  { plan: "Economico", users: 38, documents: 460, storage: "9.1 GB", percent: 30, color: "#002045" },
  { plan: "Familiar", users: 31, documents: 520, storage: "13.8 GB", percent: 24, color: "#1a365d" },
  { plan: "Premium", users: 13, documents: 140, storage: "5.5 GB", percent: 10, color: "#ba1a1a" },
];

const limitRisks = [
  { name: "Familia Rodriguez", plan: "Prueba gratuita", metric: "Documentos", used: "28 / 30", percent: 93 },
  { name: "Carlos Perez", plan: "Economico", metric: "Almacenamiento", used: "920 MB / 1 GB", percent: 90 },
  { name: "Laura Gomez", plan: "Familiar", metric: "Tokens IA", used: "318.000 / 350.000", percent: 91 },
];

const firebaseCostModel = [
  { label: "Cloud Storage", value: "42.6 GB", cost: "US$2.80", helper: "Documentos en boveda" },
  { label: "Firestore", value: "1.840 docs", cost: "US$0.00 - US$1.20", helper: "Lecturas/escrituras variables" },
  { label: "OCR + IA", value: "1.2M tokens", cost: "US$18.42", helper: "DeepSeek/OpenAI/Grok" },
];

const trialUsers = [
  { initials: "MG", name: "María González", email: "maria@example.com", period: "01 Jul - 31 Jul", day: 18, status: "Activa", color: "#13696a" },
  { initials: "CP", name: "Carlos Pérez", email: "carlos.p@domain.com", period: "12 Jun - 12 Jul", day: 28, status: "Por vencer", color: "#ba1a1a" },
  { initials: "AR", name: "Ana Rodríguez", email: "ana.r@health.com", period: "05 Jul - 04 Ago", day: 5, status: "Activa", color: "#13696a" },
  { initials: "LG", name: "Laura Gómez", email: "laura@app.com", period: "01 Jun - 01 Jul", day: 30, status: "Vencida", color: "#ba1a1a" },
];

const aiUsers = [
  { name: "Luis Martínez", plan: "Familiar", tokens: "85.200 / 100.000", percent: 85, provider: "DeepSeek", cost: "US$3.45", status: "Alto consumo" },
  { name: "Laura Gómez", plan: "Económico", tokens: "32.100 / 100.000", percent: 32, provider: "OpenAI", cost: "US$1.12", status: "Normal" },
  { name: "Carlos Pérez", plan: "Trial", tokens: "19.600 / 20.000", percent: 98, provider: "DeepSeek", cost: "US$0.84", status: "Límite alcanzado" },
];

const alerts = [
  { icon: "error", title: "Límite de tokens crítico", text: "Carlos Pérez consumió el 98% de su cuota mensual.", level: "Critical", color: "#ba1a1a" },
  { icon: "notifications_active", title: "Pruebas por vencer", text: "8 usuarios entrarán en cierre de prueba en 48 horas.", level: "Warning", color: "#13696a" },
  { icon: "info", title: "Proveedor IA estable", text: "DeepSeek responde sin errores críticos en las últimas 24 horas.", level: "Info", color: "#002045" },
];

const providerCosts = [
  { provider: "DeepSeek", cost: "US$12.40", share: 67, color: "#002045" },
  { provider: "OpenAI", cost: "US$5.82", share: 25, color: "#13696a" },
  { provider: "Grok", cost: "US$0.20", share: 8, color: "#133a4a" },
];

type AccessState = "checking" | "allowed" | "denied";
type TargetMode = "email" | "uid";

export default function AdminPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [access, setAccess] = useState<AccessState>("checking");
  const [adminName, setAdminName] = useState("Admin Root");
  const [targetMode, setTargetMode] = useState<TargetMode>("email");
  const [targetValue, setTargetValue] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<AdminPlanId>("economico");
  const [selectedStatus, setSelectedStatus] = useState<AdminSubscriptionStatus>("active");
  const [changeReason, setChangeReason] = useState("activacion_admin");
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [planUpdateResult, setPlanUpdateResult] = useState<AdminSubscriptionUpdateResponse | null>(null);
  const [planUpdateError, setPlanUpdateError] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const token = await getIdTokenResult(user, true).catch(() => null);
      const claimRole = token?.claims.role;
      const hasAdminClaim = claimRole === "admin" || claimRole === "owner" || token?.claims.admin === true || token?.claims.owner === true;
      const snap = await getDoc(doc(db, "users", user.uid)).catch(() => null);
      const data = snap?.exists() ? snap.data() : {};
      const role = data.role;
      setAdminName(user.displayName || user.email || "Admin Root");
      setAccess(hasAdminClaim || role === "admin" || role === "owner" ? "allowed" : "denied");
    });

    return unsub;
  }, [router]);

  const monthlyCost = useMemo(
    () => providerCosts.reduce((sum, item) => sum + Number(item.cost.replace("US$", "")), 0).toFixed(2),
    []
  );
  const selectedPlanDefinition = getPlanDefinition(selectedPlan);

  async function handleSubscriptionUpdate(event: React.FormEvent) {
    event.preventDefault();
    setPlanUpdateError("");
    setPlanUpdateResult(null);

    const target = targetValue.trim();
    if (!target) {
      setPlanUpdateError("Ingresa el email o UID del usuario.");
      return;
    }

    setUpdatingPlan(true);
    try {
      const result = await updateAdminSubscription({
        target_email: targetMode === "email" ? target : undefined,
        target_uid: targetMode === "uid" ? target : undefined,
        plan: selectedPlan,
        subscription_status: selectedStatus,
        reason: changeReason.trim() || "admin_update",
      });
      setPlanUpdateResult(result);
    } catch (error) {
      setPlanUpdateError(error instanceof Error ? error.message : "No se pudo actualizar el plan.");
    } finally {
      setUpdatingPlan(false);
    }
  }

  if (access === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7fafc]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-pulse text-5xl text-[#002045]">admin_panel_settings</span>
          <p className="text-sm font-semibold text-[#43474e]">Verificando acceso administrativo…</p>
        </div>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7fafc] px-4">
        <section className="max-w-md rounded-2xl border border-[#c4c6cf] bg-white p-6 text-center shadow-[0px_4px_20px_rgba(26,54,93,0.08)]">
          <span className="material-symbols-outlined mb-3 text-5xl text-[#ba1a1a]">lock</span>
          <h1 className="text-2xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            Acceso restringido
          </h1>
          <p className="mt-2 text-sm text-[#43474e]">
            Este panel solo está disponible para cuentas con rol <strong>admin</strong> u <strong>owner</strong>.
          </p>
          <Link href="/dashboard" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#002045] px-5 text-sm font-semibold text-white">
            Volver al dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafc] text-[#181c1e]">
      <button
        className="fixed right-4 top-4 z-[70] rounded-lg bg-[#002045] p-2 text-white shadow-lg md:hidden"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
      >
        <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
      </button>

      {menuOpen && <div className="fixed inset-0 z-40 bg-black/25 md:hidden" onClick={() => setMenuOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 p-6">
          <span className="material-symbols-outlined text-3xl text-[#002045]" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield_with_heart
          </span>
          <h1 className="text-2xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            AppMiSalud <span className="text-[#13696a]">Admin</span>
          </h1>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {adminNav.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-lg p-4 text-left text-sm font-semibold transition-all ${
                item.active
                  ? "border-r-4 border-[#002045] bg-[#002045]/5 text-[#002045]"
                  : "text-[#43474e] hover:bg-[#f1f4f6]"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="ml-auto rounded-full bg-[#ba1a1a] px-1.5 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-[#c4c6cf] bg-[#f1f4f6] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a365d] font-bold text-[#86a0cd]">
              {adminName[0]?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#002045]">{adminName}</p>
              <p className="text-xs text-[#43474e]">Dueño de producto</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="md:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#c4c6cf]/30 bg-white/85 px-4 backdrop-blur-md md:px-12">
          <div>
            <h2 className="text-2xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Panel administrador
            </h2>
            <p className="text-xs font-medium text-[#43474e]">Control operativo de AppMiSalud Familia</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="hidden rounded-lg border border-[#c4c6cf] bg-[#f1f4f6] px-3 py-2 text-sm font-semibold text-[#43474e] sm:block">
              <option>Últimos 30 días</option>
              <option>Mes actual</option>
              <option>Hoy</option>
            </select>
            <button className="flex items-center gap-2 rounded-lg bg-[#002045] px-4 py-2 text-sm font-semibold text-white shadow-md">
              <span className="material-symbols-outlined text-[20px]">download</span>
              <span className="hidden md:inline">Exportar reporte</span>
            </button>
          </div>
        </header>

        <div className="space-y-6 p-4 md:p-12">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-[#c4c6cf] bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                    Planes y capacidad
                  </h3>
                  <p className="text-sm text-[#43474e]">Base para medir documentos, almacenamiento e IA por familia.</p>
                </div>
                <span className="rounded-full bg-[#a2eded]/40 px-3 py-1 text-xs font-bold text-[#13696a]">Fase 1</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {planBreakdown.map((plan) => (
                  <PlanMixCard key={plan.plan} {...plan} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#c4c6cf] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                Costos estimados
              </h3>
              <p className="mt-1 text-sm text-[#43474e]">Modelo inicial para Firebase Blaze, Google Cloud e IA.</p>
              <div className="mt-5 space-y-4">
                {firebaseCostModel.map((item) => (
                  <CostModelCard key={item.label} {...item} />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#c4c6cf] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                  Usuarios cerca del limite
                </h3>
                <p className="text-sm text-[#43474e]">En esta fase son alertas informativas; no bloquean carga ni IA.</p>
              </div>
              <button className="rounded-lg bg-[#f1f4f6] px-3 py-2 text-sm font-semibold text-[#13696a]">Ver reglas</button>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {limitRisks.map((risk) => (
                <LimitRiskCard key={`${risk.name}-${risk.metric}`} {...risk} />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-[#c4c6cf] bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                    Cambiar plan de usuario
                  </h3>
                  <p className="text-sm text-[#43474e]">Accion segura via backend. Actualiza plan, estado, limites y deja auditoria.</p>
                </div>
                <span className="rounded-full bg-[#002045]/10 px-3 py-1 text-xs font-bold text-[#002045]">Fase 3</span>
              </div>

              <form onSubmit={handleSubscriptionUpdate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <div className="mb-2 flex w-fit rounded-lg border border-[#c4c6cf] bg-[#f7fafc] p-1">
                    {(["email", "uid"] as TargetMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTargetMode(mode)}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold ${targetMode === mode ? "bg-[#002045] text-white" : "text-[#43474e]"}`}
                      >
                        {mode === "email" ? "Email" : "UID"}
                      </button>
                    ))}
                  </div>
                  <label className="text-sm font-semibold text-[#43474e]">{targetMode === "email" ? "Email del usuario" : "UID del usuario"}</label>
                  <input
                    value={targetValue}
                    onChange={(event) => setTargetValue(event.target.value)}
                    placeholder={targetMode === "email" ? "usuario@correo.com" : "Firebase UID"}
                    className="mt-1 h-12 w-full rounded-xl border border-[#c4c6cf] bg-[#f7fafc] px-4 text-sm outline-none focus:border-[#13696a]"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#43474e]">Plan</label>
                  <select
                    value={selectedPlan}
                    onChange={(event) => setSelectedPlan(event.target.value as AdminPlanId)}
                    className="mt-1 h-12 w-full rounded-xl border border-[#c4c6cf] bg-[#f7fafc] px-4 text-sm outline-none focus:border-[#13696a]"
                  >
                    <option value="free_trial">Prueba gratuita</option>
                    <option value="economico">Economico</option>
                    <option value="familiar">Familiar</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#43474e]">Estado</label>
                  <select
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value as AdminSubscriptionStatus)}
                    className="mt-1 h-12 w-full rounded-xl border border-[#c4c6cf] bg-[#f7fafc] px-4 text-sm outline-none focus:border-[#13696a]"
                  >
                    <option value="trial">Trial</option>
                    <option value="trial_expired">Trial vencido</option>
                    <option value="active">Activo</option>
                    <option value="past_due">Pago pendiente</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-[#43474e]">Motivo interno</label>
                  <input
                    value={changeReason}
                    onChange={(event) => setChangeReason(event.target.value)}
                    className="mt-1 h-12 w-full rounded-xl border border-[#c4c6cf] bg-[#f7fafc] px-4 text-sm outline-none focus:border-[#13696a]"
                  />
                </div>

                {planUpdateError && (
                  <div className="md:col-span-2 rounded-xl border border-[#ba1a1a]/30 bg-[#ffdad6]/60 p-3 text-sm font-semibold text-[#ba1a1a]">
                    {planUpdateError}
                  </div>
                )}

                {planUpdateResult && (
                  <div className="md:col-span-2 rounded-xl border border-[#13696a]/30 bg-[#d7f5f1] p-3 text-sm text-[#13696a]">
                    Plan actualizado para {planUpdateResult.target_email || planUpdateResult.target_uid}. Limite: {planUpdateResult.limits.maxDocuments} documentos y {formatBytes(planUpdateResult.limits.maxStorageBytes)}.
                  </div>
                )}

                <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#43474e]">El cambio se guarda en Firestore y en auditLogs del usuario.</p>
                  <button
                    type="submit"
                    disabled={updatingPlan}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#002045] px-5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {updatingPlan ? "Actualizando..." : "Aplicar cambio"}
                    <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl border border-[#c4c6cf] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                Limites del plan
              </h3>
              <p className="mt-1 text-sm text-[#43474e]">{selectedPlanDefinition.description}</p>
              <div className="mt-5 space-y-3">
                <LimitLine label="Documentos" value={`${selectedPlanDefinition.maxDocuments}`} />
                <LimitLine label="Storage" value={formatBytes(selectedPlanDefinition.maxStorageBytes)} />
                <LimitLine label="Tokens IA/mes" value={`${selectedPlanDefinition.maxAiTokensMonth.toLocaleString("es-CO")}`} />
                <LimitLine label="Solicitudes IA/mes" value={`${selectedPlanDefinition.maxAiRequestsMonth.toLocaleString("es-CO")}`} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-[#c4c6cf] bg-white shadow-sm lg:col-span-2">
              <SectionHeader title="Pruebas gratuitas" action="Ver todas" />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f1f4f6] text-xs uppercase text-[#43474e]">
                    <tr>
                      <th className="px-6 py-3">Usuario</th>
                      <th className="px-6 py-3">Periodo</th>
                      <th className="px-6 py-3">Progreso</th>
                      <th className="px-6 py-3">Estado</th>
                      <th className="px-6 py-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c6cf]">
                    {trialUsers.map((user) => (
                      <TrialRow key={user.email} user={user} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#c4c6cf] bg-white shadow-sm">
              <div className="border-b border-[#c4c6cf] bg-[#f1f4f6] p-6">
                <h3 className="flex items-center gap-2 text-xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                  <span className="material-symbols-outlined text-[#ba1a1a]">warning</span>
                  Alertas operativas
                </h3>
              </div>
              <div className="space-y-4 p-6">
                {alerts.map((alert) => (
                  <AlertCard key={alert.title} {...alert} />
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-[#c4c6cf] bg-white shadow-sm xl:col-span-2">
              <SectionHeader title="Consumo IA por usuario" action="Detalle mensual" />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#f1f4f6] text-xs uppercase text-[#43474e]">
                    <tr>
                      <th className="px-6 py-3">Usuario</th>
                      <th className="px-6 py-3">Plan</th>
                      <th className="px-6 py-3">Tokens</th>
                      <th className="px-6 py-3">Proveedor</th>
                      <th className="px-6 py-3">Costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c4c6cf]">
                    {aiUsers.map((user) => (
                      <AiUsageRow key={user.name} user={user} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-[#c4c6cf] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                Costos IA
              </h3>
              <p className="mt-1 text-sm text-[#43474e]">Total mensual estimado: <strong className="text-[#13696a]">US${monthlyCost}</strong></p>
              <div className="mt-5 space-y-4">
                {providerCosts.map((item) => (
                  <ProviderCost key={item.provider} {...item} />
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="rounded-2xl bg-[#002045] p-6 text-white lg:col-span-3">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h4 className="text-2xl font-bold" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                    Acciones rápidas de admin
                  </h4>
                  <p className="text-sm text-[#adc7f7]">Gestión inmediata de accesos, pruebas y límites de IA.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["add_circle", "Extender"],
                    ["bolt", "Activar"],
                    ["block", "Suspender"],
                    ["settings_suggest", "Límites"],
                  ].map(([icon, label]) => (
                    <button key={label} className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/10 p-4 text-xs font-semibold hover:bg-white/20">
                      <span className="material-symbols-outlined">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#13696a]/20 bg-[#a2eded]/40 p-6">
              <div className="flex items-center gap-2 font-bold text-[#13696a]">
                <span className="material-symbols-outlined">security</span>
                Privacidad
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#1a6d6e]">
                Este panel muestra métricas operativas. No expone documentos médicos ni contenido clínico sensible.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function KpiCard({ icon, label, value, delta, color }: { icon: string; label: string; value: string; delta: string; color: string }) {
  return (
    <div className="rounded-xl border-l-4 bg-white p-4 shadow-[0px_4px_20px_rgba(26,54,93,0.08)]" style={{ borderLeftColor: color }}>
      <div className="mb-2 flex items-start justify-between">
        <span className="material-symbols-outlined rounded-lg p-1.5" style={{ color, backgroundColor: `${color}14` }}>
          {icon}
        </span>
        <span className="text-xs font-bold" style={{ color }}>{delta}</span>
      </div>
      <p className="text-xs font-semibold text-[#43474e]">{label}</p>
      <p className="text-2xl font-bold text-[#002045]">{value}</p>
    </div>
  );
}

function PlanMixCard({ plan, users, documents, storage, percent, color }: { plan: string; users: number; documents: number; storage: string; percent: number; color: string }) {
  return (
    <div className="rounded-xl border border-[#c4c6cf]/40 bg-[#f7fafc] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-[#002045]">{plan}</p>
          <p className="text-xs text-[#43474e]">{users} familias activas</p>
        </div>
        <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ color, backgroundColor: `${color}16` }}>
          {percent}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e0e3e5]">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-[#74777f]">Documentos</p>
          <p className="font-bold text-[#002045]">{documents}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[#74777f]">Storage</p>
          <p className="font-bold text-[#002045]">{storage}</p>
        </div>
      </div>
    </div>
  );
}

function CostModelCard({ label, value, cost, helper }: { label: string; value: string; cost: string; helper: string }) {
  return (
    <div className="rounded-xl border border-[#c4c6cf]/40 bg-[#f7fafc] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#002045]">{label}</p>
          <p className="text-xs text-[#43474e]">{helper}</p>
        </div>
        <p className="text-sm font-bold text-[#13696a]">{cost}</p>
      </div>
      <p className="mt-3 text-xs font-semibold uppercase text-[#74777f]">{value}</p>
    </div>
  );
}

function LimitRiskCard({ name, plan, metric, used, percent }: { name: string; plan: string; metric: string; used: string; percent: number }) {
  const color = percent >= 90 ? "#ba1a1a" : "#b26a00";

  return (
    <div className="rounded-xl border border-[#c4c6cf]/40 bg-[#f7fafc] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-[#002045]">{name}</p>
          <p className="text-xs text-[#43474e]">{plan} · {metric}</p>
        </div>
        <span className="material-symbols-outlined" style={{ color }}>warning</span>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#43474e]">
        <span>{used}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e0e3e5]">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function LimitLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#c4c6cf]/40 bg-[#f7fafc] px-4 py-3">
      <span className="text-sm font-semibold text-[#43474e]">{label}</span>
      <span className="text-sm font-bold text-[#002045]">{value}</span>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#c4c6cf] p-6">
      <h3 className="text-xl font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
        {title}
      </h3>
      <button className="text-sm font-semibold text-[#13696a] hover:underline">{action}</button>
    </div>
  );
}

function TrialRow({ user }: { user: (typeof trialUsers)[number] }) {
  const percent = Math.round((user.day / 30) * 100);
  return (
    <tr className="hover:bg-[#f7fafc]">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a2eded] text-xs font-bold text-[#1a6d6e]">{user.initials}</div>
          <div>
            <p className="text-sm font-bold text-[#002045]">{user.name}</p>
            <p className="text-xs text-[#43474e]">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-[#43474e]">{user.period}</td>
      <td className="px-6 py-4">
        <div className="w-32">
          <div className="mb-1 flex justify-between text-[10px] text-[#43474e]">
            <span>Día {user.day} de 30</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e0e3e5]">
            <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: user.color }} />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: user.color, backgroundColor: `${user.color}18` }}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4">
        <button className="rounded-lg p-2 text-[#43474e] hover:bg-[#f1f4f6]">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </td>
    </tr>
  );
}

function AiUsageRow({ user }: { user: (typeof aiUsers)[number] }) {
  const color = user.percent > 90 ? "#ba1a1a" : user.percent > 75 ? "#002045" : "#13696a";
  return (
    <tr>
      <td className="px-6 py-4 text-sm font-bold text-[#002045]">{user.name}</td>
      <td className="px-6 py-4">
        <span className="rounded bg-[#c3e8fd] px-2 py-0.5 text-xs font-semibold text-[#274b5c]">{user.plan}</span>
      </td>
      <td className="px-6 py-4">
        <div className="flex min-w-40 items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e0e3e5]">
            <div className="h-full rounded-full" style={{ width: `${user.percent}%`, backgroundColor: color }} />
          </div>
          <span className="text-xs font-bold text-[#43474e]">{user.percent}%</span>
        </div>
        <p className="mt-1 text-xs text-[#74777f]">{user.tokens}</p>
      </td>
      <td className="px-6 py-4 text-sm text-[#43474e]">{user.provider}</td>
      <td className="px-6 py-4 text-sm font-bold text-[#13696a]">{user.cost}</td>
    </tr>
  );
}

function AlertCard({ icon, title, text, level, color }: { icon: string; title: string; text: string; level: string; color: string }) {
  return (
    <div className="flex gap-4 rounded-xl border p-4" style={{ borderColor: `${color}22`, backgroundColor: `${color}10` }}>
      <span className="material-symbols-outlined shrink-0" style={{ color, fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold text-[#002045]">{title}</p>
        <p className="text-sm text-[#43474e]">{text}</p>
        <span className="mt-1 block text-[11px] font-bold uppercase" style={{ color }}>{level}</span>
      </div>
    </div>
  );
}

function ProviderCost({ provider, cost, share, color }: { provider: string; cost: string; share: number; color: string }) {
  return (
    <div className="rounded-xl border border-[#c4c6cf]/30 bg-[#f1f4f6] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-bold text-[#002045]">{provider}</span>
        <span className="font-bold text-[#13696a]">{cost}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#e0e3e5]">
        <div className="h-full" style={{ width: `${share}%`, backgroundColor: color }} />
      </div>
      <p className="mt-2 text-xs text-[#43474e]">{share}% del volumen mensual</p>
    </div>
  );
}
