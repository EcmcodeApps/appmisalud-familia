"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { useTrialStatus } from "@/lib/hooks/useTrialStatus";
import { TrialStatusCard } from "@/components/TrialStatusCard";

const quickActions = [
  { href: "/boveda/subir", icon: "upload_file", label: "Subir doc." },
  { href: "/personas", icon: "person_add", label: "Agregar persona" },
  { href: "/asistente", icon: "summarize", label: "Generar resumen" },
  { href: "/asistente", icon: "auto_awesome", label: "Preguntar IA", fill: true },
  { href: "/compartir", icon: "share", label: "Compartir" },
];

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("Usuario");
  const { trial } = useTrialStatus();

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) setDisplayName(user.displayName.split(" ")[0]);
  }, []);

  return (
    <div className="px-4 md:px-12 max-w-6xl mx-auto space-y-6 py-6">
      <section>
        <h2
          className="text-2xl md:text-[32px] font-bold text-[#002045]"
          style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
          Hola, {displayName}.
        </h2>
        <p className="text-[#43474e] text-lg">
          Este es tu centro medico familiar. Empieza agregando una persona o subiendo tu primer documento.
        </p>
      </section>

      {trial && <TrialStatusCard trial={trial} />}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <section
          className="md:col-span-8 bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider">Personas a mi cargo</h3>
            <Link href="/personas" className="text-[#13696a] font-semibold text-xs hover:underline">
              Gestionar
            </Link>
          </div>
          <EmptyPanel
            icon="group_add"
            title="Aun no hay personas registradas"
            text="Crea perfiles para organizar documentos, examenes, alergias y contactos de emergencia por cada integrante."
            actionHref="/personas"
            actionLabel="Agregar persona"
          />
        </section>

        <section
          className="md:col-span-4 rounded-2xl p-4 relative overflow-hidden flex flex-col min-h-[240px]"
          style={{ backgroundColor: "#002045", boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: "#13696a" }}
          />
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-1 mb-4">
              <span className="material-symbols-outlined text-white text-[20px]">event</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider opacity-80">Proxima cita</h3>
            </div>
            <div className="mt-auto">
              <p
                className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                Sin citas registradas
              </p>
              <p className="text-white opacity-90 text-sm mb-4">
                Cuando agregues recordatorios o citas medicas, apareceran aqui.
              </p>
              <Link
                href="/personas"
                className="block text-center w-full py-2 rounded-lg font-semibold text-sm hover:scale-[1.02] transition-transform"
                style={{ backgroundColor: "#a2eded", color: "#1a6d6e" }}>
                Preparar perfiles
              </Link>
            </div>
          </div>
        </section>

        <section
          className="md:col-span-12 rounded-2xl p-4 border-[1.5px] border-[#13696a] bg-white"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(162,237,237,0.3)" }}>
                <span className="material-symbols-outlined text-[#13696a] text-3xl">auto_awesome</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="text-lg font-bold text-[#002045]"
                    style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                    IA de salud lista para ayudarte
                  </h3>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                    style={{ backgroundColor: "#c3e8fd", color: "#001e2b" }}>
                    <span className="material-symbols-outlined text-[12px]">psychology</span> IA RESPONSABLE
                  </span>
                </div>
                <p className="text-sm text-[#43474e] max-w-2xl">
                  Sube documentos medicos para que la IA pueda extraer texto, resumir hallazgos y responder preguntas
                  sobre tu propia boveda.
                </p>
              </div>
            </div>
            <Link
              href="/boveda/subir"
              className="text-white px-6 py-2 rounded-full font-semibold text-sm flex items-center gap-1 self-start md:self-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#13696a" }}>
              Subir primer documento
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
            </Link>
          </div>
        </section>

        <section className="md:col-span-7 space-y-4">
          <div
            className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
            style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider">Documentos recientes</h3>
              <span className="material-symbols-outlined text-[#43474e]">folder_open</span>
            </div>
            <EmptyList
              icon="upload_file"
              title="No hay documentos todavia"
              text="Sube PDFs, examenes o imagenes para activar OCR y resumen medico."
              href="/boveda/subir"
              label="Subir documento"
            />
          </div>

          <div
            className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
            style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider">Examenes con cambios</h3>
              <span className="material-symbols-outlined text-[#74777f]">monitoring</span>
            </div>
            <EmptyList
              icon="check_circle"
              title="Sin cambios detectados"
              text="Cuando existan examenes comparables, aqui veras alertas y variaciones importantes."
              href="/boveda"
              label="Ver boveda"
              subtle
            />
          </div>
        </section>

        <section className="md:col-span-5 space-y-4">
          <Link
            href="/emergencia"
            className="w-full rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#ba1a1a", color: "#ffffff", boxShadow: "0 4px 12px rgba(186,26,26,0.3)" }}>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl">emergency</span>
              <div className="text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider">Resumen de Emergencia</h3>
                <p className="text-sm opacity-90">Disponible cuando agregues personas y datos clinicos</p>
              </div>
            </div>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
          </Link>

          <div
            className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
            style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
            <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider mb-4">Actividad reciente</h3>
            <EmptyList
              icon="history"
              title="Sin actividad por ahora"
              text="Aqui apareceran cargas, resumenes, actualizaciones y acciones importantes de tu cuenta."
              href="/boveda/subir"
              label="Crear primera actividad"
              subtle
            />
          </div>
        </section>
      </div>

      <section className="py-2">
        <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider mb-3">Acciones rapidas</h3>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className="flex-shrink-0 flex flex-col items-center gap-1 group">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: "#a5eff0" }}>
                <span
                  className="material-symbols-outlined text-2xl text-[#002045]"
                  style={action.fill ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {action.icon}
                </span>
              </div>
              <span className="text-xs font-semibold whitespace-nowrap text-[#002045]">{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="flex justify-center py-4 opacity-60">
        <div className="px-4 py-2 rounded-full flex items-center gap-2" style={{ backgroundColor: "rgba(214,227,255,0.2)" }}>
          <span className="material-symbols-outlined text-[#002045] text-[16px]">lock</span>
          <span className="text-xs font-bold text-[#002045] uppercase tracking-widest">
            Tus datos estan protegidos con grado medico
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  text,
  actionHref,
  actionLabel,
}: {
  icon: string;
  title: string;
  text: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="min-h-[180px] rounded-xl border-2 border-dashed border-[#c4c6cf] bg-[#f8fafb] p-5 flex flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined text-[#13696a] text-4xl mb-2">{icon}</span>
      <p className="text-sm font-bold text-[#002045]">{title}</p>
      <p className="text-sm text-[#43474e] max-w-md mt-1 mb-4">{text}</p>
      <Link href={actionHref} className="px-4 py-2 rounded-full bg-[#13696a] text-white text-sm font-semibold hover:opacity-90">
        {actionLabel}
      </Link>
    </div>
  );
}

function EmptyList({
  icon,
  title,
  text,
  href,
  label,
  subtle = false,
}: {
  icon: string;
  title: string;
  text: string;
  href: string;
  label: string;
  subtle?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-[#dfe3e8] bg-[#f8fafb]">
      <span className={`material-symbols-outlined mt-0.5 ${subtle ? "text-[#74777f]" : "text-[#13696a]"}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#002045]">{title}</p>
        <p className="text-sm text-[#43474e]">{text}</p>
        <Link href={href} className="inline-flex mt-3 text-sm font-semibold text-[#13696a] hover:underline">
          {label}
        </Link>
      </div>
    </div>
  );
}
