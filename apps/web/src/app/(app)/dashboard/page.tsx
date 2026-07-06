"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { useTrialStatus } from "@/lib/hooks/useTrialStatus";
import { TrialStatusCard } from "@/components/TrialStatusCard";

export default function DashboardPage() {
  const [displayName, setDisplayName] = useState("Usuario");
  const { trial } = useTrialStatus();

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) setDisplayName(user.displayName.split(" ")[0]);
  }, []);

  return (
    <div className="px-4 md:px-12 max-w-6xl mx-auto space-y-6 py-6">

      {/* Saludo */}
      <section>
        <h2 className="text-2xl md:text-[32px] font-bold text-[#002045]"
          style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
          Hola, {displayName}.
        </h2>
        <p className="text-[#43474e] text-lg">Este es tu centro médico familiar.</p>
      </section>

      {trial && <TrialStatusCard trial={trial} />}

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* Personas a mi cargo */}
        <section className="md:col-span-8 bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider">Personas a mi cargo</h3>
            <button className="text-[#13696a] font-semibold text-xs hover:underline">Ver todos</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <PersonCard
              name="Elena" role="Madre"
              imgSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuAqP712hdaSgoOutFUh-F7gpRc2T8ujc-zHgI21GVa53n2aFzDVu7uSI7sWxmDJErmTQ1NrEh0KQejbCweKzAiXkRhUyOMuEspVxD437sKIyclUSKdBbfgKIe-MJHwoIbCwQO7nTP4F9C3V68ZRcec2g_-1aJgU3jjT96qB7EUq6sG1Y3iyv_eo42aG8-SPyRewhUHukr1cHO1QxSB2f6gEuEX92ynxi0soKx_eljDFQN44r8nglSgva_DauZlok9r8k9Zi0gJmkHop"
              borderColor="#13696a"
            />
            <PersonCard
              name="Mateo" role="Hijo"
              imgSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuBbEhGDp-vlHN45F03a9_hzyu6o9QNbIP3FyTFKV-E_kNmKsNyTLQLjSmgo7mictI4Ihn9k9D1-_OKGlmgmvBS7TvqUDLUGloLDBWFKGDDmC2cQLsPyicZO4BJZpp0S1brispemsyypILwIjqljQRfSDI2ftMzjtHQunmVWGC9TftL9vlUcoqUAp4YyTqDmYyVwkl1fjxV87eqhFSHnsYaFXDHhtZMdUv8gf_im_SYIbHMQiK5IHiLKR7K2ym1uHtD90MdHMZwCk8hq"
              borderColor="#002045"
            />
            <button className="flex flex-col items-center justify-center p-2 rounded-xl border-2 border-dashed border-[#c4c6cf] hover:border-[#13696a] transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[#74777f] text-3xl">person_add</span>
              <span className="text-xs mt-1 font-semibold text-[#43474e]">Agregar</span>
            </button>
          </div>
        </section>

        {/* Próxima cita */}
        <section className="md:col-span-4 rounded-2xl p-4 relative overflow-hidden flex flex-col"
          style={{ backgroundColor: "#002045", boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: "#13696a" }} />
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-1 mb-4">
              <span className="material-symbols-outlined text-white text-[20px]">event</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider opacity-80">Próxima cita</h3>
            </div>
            <div className="mt-auto">
              <p className="text-2xl font-bold text-white mb-1"
                style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>Mateo González</p>
              <p className="text-white opacity-90 text-sm mb-4">Pediatría Integral<br />Mañana, 10:30 AM</p>
              <button className="w-full py-2 rounded-lg font-semibold text-sm hover:scale-[1.02] transition-transform"
                style={{ backgroundColor: "#a2eded", color: "#1a6d6e" }}>
                Confirmar Asistencia
              </button>
            </div>
          </div>
        </section>

        {/* AI Insight */}
        <section className="md:col-span-12 rounded-2xl p-4 border-[1.5px] border-[#13696a] bg-white"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(162,237,237,0.3)" }}>
                <span className="material-symbols-outlined text-[#13696a] text-3xl">auto_awesome</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[#002045]"
                    style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                    Insight de Salud: Elena
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                    style={{ backgroundColor: "#c3e8fd", color: "#001e2b" }}>
                    <span className="material-symbols-outlined text-[12px]">psychology</span> IA RESPONSABLE
                  </span>
                </div>
                <p className="text-sm text-[#43474e] max-w-2xl">
                  Hemos detectado una <strong className="text-[#002045]">tendencia al alza en los niveles de glucosa</strong> de Elena durante los últimos 7 días. Te recomendamos revisar el registro de alimentación o consultar con su nutricionista.
                </p>
              </div>
            </div>
            <button className="text-white px-6 py-2 rounded-full font-semibold text-sm flex items-center gap-1 self-start md:self-center hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#13696a" }}>
              Ver Detalles
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </button>
          </div>
        </section>

        {/* Documentos + Exámenes */}
        <section className="md:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
            style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider">Documentos recientes</h3>
              <span className="material-symbols-outlined text-[#43474e]">folder_open</span>
            </div>
            <ul className="space-y-2">
              <DocItem icon="description" title="Receta Médica - Elena" meta="Hace 2 horas • PDF" />
              <DocItem icon="lab_research" title="Analítica de Sangre - Mateo" meta="Ayer • PDF" />
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
            style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider">Exámenes con cambios</h3>
              <span className="material-symbols-outlined text-[#ba1a1a]">notification_important</span>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-xl border"
              style={{ backgroundColor: "rgba(255,218,214,0.3)", borderColor: "#ffdad6" }}>
              <span className="material-symbols-outlined text-[#ba1a1a] mt-0.5">monitoring</span>
              <div>
                <p className="text-sm font-semibold text-[#002045]">Colesterol LDL - Juan</p>
                <p className="text-sm text-[#43474e]">Subió de 110 mg/dL a 145 mg/dL. Se sugiere revisión de dieta.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Emergencia + Actividad */}
        <section className="md:col-span-5 space-y-4">
          <button className="w-full rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform"
            style={{ backgroundColor: "#ba1a1a", color: "#ffffff", boxShadow: "0 4px 12px rgba(186,26,26,0.3)" }}>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl">emergency</span>
              <div className="text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider">Resumen de Emergencia</h3>
                <p className="text-sm opacity-90">Protocolos activos para Elena y Mateo</p>
              </div>
            </div>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>

          <div className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
            style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
            <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider mb-4">Actividad Reciente</h3>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-[#c4c6cf]">
              <ActivityItem dot="#13696a" time="Hoy, 09:15 AM" text="Se subió el informe dental de Mateo" />
              <ActivityItem dot="#1a365d" time="Ayer, 06:45 PM" text="Elena completó su registro diario de presión" />
              <ActivityItem dot="#c4c6cf" time="20 May, 02:00 PM" text="Cita programada con el cardiólogo" />
            </div>
          </div>
        </section>
      </div>

      {/* Acciones rápidas */}
      <section className="py-2">
        <h3 className="text-xs font-bold text-[#002045] uppercase tracking-wider mb-3">Acciones Rápidas</h3>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
          {[
            { icon: "upload_file", label: "Subir doc." },
            { icon: "person_add", label: "Agregar pers." },
            { icon: "summarize", label: "Generar resumen" },
            { icon: "auto_awesome", label: "Preguntar IA", fill: true },
            { icon: "share", label: "Compartir doc." },
          ].map((a) => (
            <button key={a.label} className="flex-shrink-0 flex flex-col items-center gap-1 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: "#a5eff0" }}>
                <span className="material-symbols-outlined text-2xl text-[#002045]"
                  style={a.fill ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {a.icon}
                </span>
              </div>
              <span className="text-xs font-semibold whitespace-nowrap text-[#002045]">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Trust badge */}
      <div className="flex justify-center py-4 opacity-60">
        <div className="px-4 py-2 rounded-full flex items-center gap-2"
          style={{ backgroundColor: "rgba(214,227,255,0.2)" }}>
          <span className="material-symbols-outlined text-[#002045] text-[16px]">lock</span>
          <span className="text-xs font-bold text-[#002045] uppercase tracking-widest">
            Tus datos están protegidos con grado médico
          </span>
        </div>
      </div>
    </div>
  );
}

function PersonCard({ name, role, imgSrc, borderColor }: { name: string; role: string; imgSrc: string; borderColor: string }) {
  return (
    <div className="flex flex-col items-center p-2 rounded-xl hover:bg-[#f1f4f6] transition-colors cursor-pointer group">
      <div className="w-16 h-16 rounded-full overflow-hidden mb-1 border-2" style={{ borderColor }}>
        <Image src={imgSrc} alt={name} width={64} height={64} className="w-full h-full object-cover" />
      </div>
      <span className="text-sm font-semibold text-[#002045] group-hover:text-[#13696a]">{name}</span>
      <span className="text-xs text-[#43474e]">{role}</span>
    </div>
  );
}

function DocItem({ icon, title, meta }: { icon: string; title: string; meta: string }) {
  return (
    <li className="flex items-center justify-between p-2 rounded-xl hover:bg-[#ebeef0] transition-colors cursor-pointer">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#13696a]">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-[#002045]">{title}</p>
          <p className="text-xs text-[#43474e]">{meta}</p>
        </div>
      </div>
      <span className="material-symbols-outlined text-[#74777f]">download</span>
    </li>
  );
}

function ActivityItem({ dot, time, text }: { dot: string; time: string; text: string }) {
  return (
    <div className="relative pl-8">
      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white"
        style={{ backgroundColor: dot }} />
      <p className="text-xs text-[#43474e]">{time}</p>
      <p className="text-sm text-[#002045] font-medium">{text}</p>
    </div>
  );
}
