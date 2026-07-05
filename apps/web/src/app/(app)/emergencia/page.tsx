"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";

interface PersonaProfile {
  id: string;
  name: string;
  role: string;
  birthDate?: string;
  birthYear?: number;
  sex?: string;
  bloodType?: string;
  eps?: string;
  allergies?: string;
  diagnoses?: string;
  medications?: string;
  doctor?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  specialCondition?: string;
  photoURL?: string;
  isOwner?: boolean;
}

function calcAge(birthDate?: string, birthYear?: number): string {
  if (birthDate) {
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return `${age} años`;
  }
  if (birthYear) return `${new Date().getFullYear() - birthYear} años`;
  return "—";
}

function parseList(text?: string): string[] {
  if (!text) return [];
  return text.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
}

export default function EmergenciaPage() {
  const [persona, setPersona] = useState<PersonaProfile | null>(null);
  const [personas, setPersonas] = useState<PersonaProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDocs(query(collection(db, "users", uid, "personas"), orderBy("createdAt", "asc")))
      .then((snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PersonaProfile));
        setPersonas(list);
        const owner = list.find((p) => p.isOwner) ?? list[0] ?? null;
        if (owner) { setPersona(owner); setSelectedId(owner.id); }
        setLoading(false);
      });
  }, []);

  function selectPersona(id: string) {
    const p = personas.find((x) => x.id === id);
    if (p) { setPersona(p); setSelectedId(id); }
  }

  function handlePrint() { window.print(); }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `Emergencia — ${persona?.name}`, text: buildTextSummary() });
    } else {
      navigator.clipboard.writeText(buildTextSummary());
      alert("Resumen copiado al portapapeles.");
    }
  }

  function buildTextSummary(): string {
    if (!persona) return "";
    return [
      `RESUMEN DE EMERGENCIA — ${persona.name}`,
      `Grupo sanguíneo: ${persona.bloodType || "Desconocido"}`,
      `Edad: ${calcAge(persona.birthDate, persona.birthYear)}`,
      `Alergias: ${persona.allergies || "Ninguna conocida"}`,
      `Medicamentos: ${persona.medications || "Ninguno"}`,
      `Diagnósticos: ${persona.diagnoses || "Ninguno"}`,
      `EPS/Seguro: ${persona.eps || "—"}`,
      `Contacto emergencia: ${persona.emergencyName || "—"} ${persona.emergencyPhone || ""}`,
    ].join("\n");
  }

  const allergies = parseList(persona?.allergies);
  const medications = parseList(persona?.medications);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-[#002045] text-5xl animate-pulse"
          style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
      </div>
    );
  }

  return (
    <>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px]"
          style={{ backgroundColor: "#adc7f7", transform: "translate(50%,-50%)" }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-[100px]"
          style={{ backgroundColor: "#ffdad6", transform: "translate(-50%,50%)" }} />
      </div>

      <div className="pb-48 px-4 md:px-12 max-w-2xl mx-auto pt-4">

        {/* Persona selector (if multiple) */}
        {personas.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {personas.map((p) => (
              <button key={p.id} onClick={() => selectPersona(p.id)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: selectedId === p.id ? "#002045" : "#ffffff",
                  color: selectedId === p.id ? "#ffffff" : "#43474e",
                  border: selectedId === p.id ? "none" : "1px solid #c4c6cf",
                }}>
                {p.name.split(" ")[0]}
                {p.isOwner && <span className="text-[10px] opacity-70">(Yo)</span>}
              </button>
            ))}
          </div>
        )}

        {/* Critical disclaimer */}
        <div className="flex gap-3 items-start p-4 rounded-xl mb-5 border border-[rgba(186,26,26,0.2)]"
          style={{ backgroundColor: "#ffdad6" }}>
          <span className="material-symbols-outlined text-[#ba1a1a] shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <p className="text-xs text-[#93000a] font-semibold leading-relaxed">
            Este resumen no reemplaza la historia clínica oficial, sino que actúa como una guía rápida de supervivencia para personal de emergencias.
          </p>
        </div>

        {persona ? (
          <div className="space-y-4">

            {/* Identity card */}
            <section className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-white rounded-2xl p-5 flex items-center gap-4 border border-[rgba(196,198,207,0.3)]"
                style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
                {persona.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={persona.photoURL} alt={persona.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-[#d6e3ff]" />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-[#d6e3ff] flex items-center justify-center text-white text-3xl font-bold shrink-0"
                    style={{ backgroundColor: "#002045" }}>
                    {persona.name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-[#002045]"
                    style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                    {persona.name}
                  </h2>
                  <p className="text-[#43474e] text-sm">
                    {calcAge(persona.birthDate, persona.birthYear)}
                    {persona.sex ? ` • ${persona.sex}` : ""}
                  </p>
                  <p className="text-[#43474e] text-sm">{persona.role}</p>
                </div>
              </div>

              {/* Blood type */}
              <div className="rounded-2xl p-5 flex flex-col items-center justify-center text-center"
                style={{ backgroundColor: "#002045", boxShadow: "0 0 20px rgba(186,26,26,0.1)" }}>
                <span className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Grupo Sanguíneo</span>
                <span className="text-5xl font-bold text-white leading-none"
                  style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                  {persona.bloodType || "?"}
                </span>
              </div>

              {/* EPS */}
              <div className="bg-white rounded-2xl p-5 flex flex-col justify-center border border-[rgba(196,198,207,0.3)]"
                style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
                <span className="text-xs text-[#43474e] uppercase font-bold mb-1">EPS / Seguro</span>
                <p className="font-bold text-[#002045] text-base leading-snug">
                  {persona.eps || "No registrado"}
                </p>
              </div>
            </section>

            {/* Allergies */}
            <div className="bg-white rounded-2xl p-4 border-l-8 border-[#ba1a1a] border border-[rgba(196,198,207,0.3)]"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#ba1a1a]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#ba1a1a]">
                  Alergias Críticas
                </h3>
              </div>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((a) => (
                    <span key={a} className="px-3 py-1 rounded-full font-bold text-sm"
                      style={{ backgroundColor: "#ffdad6", color: "#93000a" }}>
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#43474e] italic">Sin alergias conocidas registradas.</p>
              )}
            </div>

            {/* Medications */}
            <div className="bg-white rounded-2xl p-4 border-l-8 border-[#13696a] border border-[rgba(196,198,207,0.3)]"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#13696a]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#13696a]">
                  Medicamentos Actuales
                </h3>
              </div>
              {medications.length > 0 ? (
                <ul className="space-y-1">
                  {medications.map((m) => (
                    <li key={m} className="text-sm text-[#181c1e] font-semibold">{m}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#43474e] italic">Sin medicamentos registrados.</p>
              )}
            </div>

            {/* Diagnoses */}
            <div className="bg-white rounded-2xl p-4 border-l-8 border-[#002045] border border-[rgba(196,198,207,0.3)]"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#002045]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>clinical_notes</span>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#002045]">
                  Diagnósticos Activos
                </h3>
              </div>
              <p className="text-sm text-[#181c1e]">
                {persona.diagnoses || "Sin diagnósticos registrados."}
              </p>
              {persona.specialCondition && (
                <p className="mt-2 text-xs text-[#43474e] italic">
                  Condición especial: {persona.specialCondition}
                </p>
              )}
            </div>

            {/* Emergency contact + Doctor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
                style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
                <span className="text-xs font-bold uppercase tracking-wider text-[#43474e]">
                  Contacto de Emergencia
                </span>
                <p className="font-bold text-[#002045] mt-1">
                  {persona.emergencyName || "No registrado"}
                </p>
                {persona.emergencyPhone && (
                  <a href={`tel:${persona.emergencyPhone}`}
                    className="flex items-center gap-1 mt-1 font-bold text-[#13696a] text-sm hover:underline">
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    {persona.emergencyPhone}
                  </a>
                )}
              </div>
              <div className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)]"
                style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
                <span className="text-xs font-bold uppercase tracking-wider text-[#43474e]">
                  Médico Tratante
                </span>
                <p className="font-bold text-[#002045] mt-1">
                  {persona.doctor || "No registrado"}
                </p>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex justify-center items-center gap-2 opacity-60 py-2">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span className="text-xs">Datos encriptados y verificados por AppMiSalud Familia</span>
            </div>

          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#ffdad6" }}>
              <span className="material-symbols-outlined text-[#ba1a1a] text-5xl">person_off</span>
            </div>
            <p className="font-bold text-[#002045] text-lg"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Sin perfiles registrados
            </p>
            <p className="text-sm text-[#43474e] max-w-xs">
              Agrega personas en la sección Personas para ver su resumen de emergencia.
            </p>
          </div>
        )}
      </div>

      {/* Bottom action sheet */}
      <nav className="fixed bottom-0 w-full z-50 border-t border-[rgba(196,198,207,0.3)]"
        style={{ backgroundColor: "#ffffff", boxShadow: "0px -4px 20px rgba(26,54,93,0.08)" }}>
        <div className="max-w-2xl mx-auto p-4 space-y-3">
          <button onClick={() => setShowQR(true)}
            className="w-full h-14 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ backgroundColor: "#002045" }}>
            <span className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
            Mostrar en urgencias
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handlePrint}
              className="h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ backgroundColor: "#e5e9eb", color: "#181c1e" }}>
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Descargar PDF
            </button>
            <button onClick={handleShare}
              className="h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ backgroundColor: "#e5e9eb", color: "#181c1e" }}>
              <span className="material-symbols-outlined text-[18px]">share</span>
              Compartir
            </button>
          </div>
        </div>
      </nav>

      {/* QR modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,32,69,0.5)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center space-y-4"
            style={{ boxShadow: "0 24px 48px rgba(0,32,69,0.3)" }}
            onClick={(e) => e.stopPropagation()}>
            {/* QR via Google Chart API — encodes the text summary */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://chart.googleapis.com/chart?chs=240x240&cht=qr&chl=${encodeURIComponent(buildTextSummary())}&choe=UTF-8`}
              alt="QR Emergencia"
              className="w-60 h-60 mx-auto rounded-xl"
            />
            <h3 className="font-bold text-xl text-[#002045]"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Vista de Urgencias
            </h3>
            <p className="text-xs text-[#43474e]">
              Muestra este código al personal médico para acceso rápido al resumen.
            </p>
            <button onClick={() => setShowQR(false)}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: "#002045", color: "#ffffff" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
