"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection, onSnapshot, query, orderBy, deleteDoc, doc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase/config";

interface MedDoc {
  id: string;
  personaName: string;
  personaRole: string;
  personaId: string;
  docType: string;
  date: string;
  doctor: string;
  institution: string;
  notes: string;
  fileName: string;
  fileType: string;
  downloadURL: string;
  storagePath: string;
  aiProcess: boolean;
  aiReady?: boolean;
}

const ICON_MAP: Record<string, string> = {
  "Resultado de Laboratorio": "lab_research",
  "Receta Médica":            "prescriptions",
  "Radiografía / Imagen":     "radiology",
  "Informe de Alta":          "summarize",
  "Epicrisis":                "clinical_notes",
  "Vacuna":                   "vaccines",
  "Otro":                     "description",
};

const BG_MAP: Record<string, string> = {
  "Resultado de Laboratorio": "rgba(162,237,237,0.3)",
  "Receta Médica":            "rgba(214,227,255,0.5)",
  "Radiografía / Imagen":     "rgba(195,232,253,0.5)",
  "Informe de Alta":          "rgba(162,237,237,0.2)",
  "Epicrisis":                "rgba(162,237,237,0.2)",
  "Vacuna":                   "rgba(255,218,214,0.3)",
  "Otro":                     "rgba(196,198,207,0.3)",
};

const CHIPS = ["Todos", "Resultado de Laboratorio", "Receta Médica", "Radiografía / Imagen", "Vacuna", "Informe de Alta", "Otro"];

function isExpiringSoon(d: MedDoc) {
  if (d.docType !== "Receta Médica" || !d.date) return null;
  const docDate = new Date(d.date);
  const expiry = new Date(docDate);
  expiry.setDate(expiry.getDate() + 30);
  const diff = Math.ceil((expiry.getTime() - Date.now()) / 86400000);
  if (diff < 0) return "Vencida";
  if (diff <= 5) return `Vence en ${diff} días`;
  return null;
}

function matchesDateFilter(d: MedDoc, filter: string) {
  if (filter === "Cualquier fecha" || !d.date) return true;
  const docDate = new Date(d.date);
  const now = new Date();
  if (filter === "Últimos 30 días") {
    const cutoff = new Date(); cutoff.setDate(now.getDate() - 30);
    return docDate >= cutoff;
  }
  if (filter === "Este año") return docDate.getFullYear() === now.getFullYear();
  return true;
}

export default function BovedaPage() {
  const [docs, setDocs] = useState<MedDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const [chip, setChip] = useState("Todos");
  const [filterPersona, setFilterPersona] = useState("Todos");
  const [filterDate, setFilterDate] = useState("Cualquier fecha");
  const [filterFile, setFilterFile] = useState("Todos");

  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = onSnapshot(
      query(collection(db, "users", uid, "documents"), orderBy("createdAt", "desc")),
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedDoc)));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Build persona list from docs
  const personas = ["Todos", ...Array.from(new Set(docs.map((d) => d.personaName).filter(Boolean)))];

  const visible = docs.filter((d) => {
    if (chip !== "Todos" && d.docType !== chip) return false;
    if (filterPersona !== "Todos" && d.personaName !== filterPersona) return false;
    if (!matchesDateFilter(d, filterDate)) return false;
    if (filterFile === "Solo PDFs" && d.fileType !== "pdf") return false;
    if (filterFile === "Imágenes" && !["jpg","jpeg","png","webp","gif"].includes(d.fileType?.toLowerCase() ?? "")) return false;
    return true;
  });

  async function handleDelete(d: MedDoc) {
    if (!confirm(`¿Eliminar "${d.fileName}"? Esta acción no se puede deshacer.`)) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setDeleting(d.id);
    try {
      await deleteDoc(doc(db, "users", uid, "documents", d.id));
      if (d.storagePath) await deleteObject(ref(storage, d.storagePath));
    } finally {
      setDeleting(null);
    }
  }

  function shareDoc(d: MedDoc) {
    if (navigator.share) {
      navigator.share({ title: d.docType, text: `${d.docType} — ${d.personaName}`, url: d.downloadURL });
    } else {
      navigator.clipboard.writeText(d.downloadURL);
      alert("Enlace copiado al portapapeles.");
    }
  }

  return (
    <div className="px-4 md:px-12 max-w-7xl mx-auto pb-6">

      {/* Header */}
      <section className="py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-[32px] font-bold text-[#002045]"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Documentos médicos
            </h2>
            <p className="text-[#43474e] mt-1">Tu bóveda familiar segura y organizada.</p>
          </div>
          <Link href="/boveda/subir"
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm text-white hover:opacity-90 transition-opacity self-start"
            style={{ backgroundColor: "#002045" }}>
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Subir Documento
          </Link>
        </div>
      </section>

      {/* Filters */}
      <section className="mb-8 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FilterSelect label="Persona" icon="expand_more"
            value={filterPersona} onChange={setFilterPersona}
            options={personas} />
          <FilterSelect label="Categoría" icon="expand_more"
            value={chip} onChange={setChip}
            options={["Todos", ...CHIPS.slice(1)]} />
          <FilterSelect label="Fecha" icon="calendar_month"
            value={filterDate} onChange={setFilterDate}
            options={["Cualquier fecha", "Últimos 30 días", "Este año"]} />
          <FilterSelect label="Tipo" icon="filter_list"
            value={filterFile} onChange={setFilterFile}
            options={["Todos", "Solo PDFs", "Imágenes"]} />
        </div>

        {/* Chips */}
        <div className="flex overflow-x-auto gap-2 pb-1" style={{ scrollbarWidth: "none" }}>
          {CHIPS.map((c) => (
            <button key={c} onClick={() => setChip(c)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: chip === c ? "#002045" : "#e5e9eb",
                color: chip === c ? "#ffffff" : "#43474e",
              }}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Doc grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <span className="material-symbols-outlined text-[#002045] text-5xl animate-pulse"
            style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState onClear={() => { setChip("Todos"); setFilterPersona("Todos"); setFilterDate("Cualquier fecha"); setFilterFile("Todos"); }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12">
          {visible.map((d, i) => (
            <DocCard
              key={d.id}
              doc={d}
              wide={visible.length % 2 !== 0 && i === visible.length - 1}
              deleting={deleting === d.id}
              onDelete={() => handleDelete(d)}
              onShare={() => shareDoc(d)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <Link href="/boveda/subir"
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center z-40 hover:scale-105 active:scale-95 transition-all"
        style={{ backgroundColor: "#002045", boxShadow: "0 4px 16px rgba(0,32,69,0.3)" }}>
        <span className="material-symbols-outlined text-white text-2xl">add</span>
      </Link>
    </div>
  );
}

function DocCard({ doc: d, wide, deleting, onDelete, onShare }: {
  doc: MedDoc; wide: boolean; deleting: boolean;
  onDelete: () => void; onShare: () => void;
}) {
  const icon  = ICON_MAP[d.docType] ?? "description";
  const bg    = BG_MAP[d.docType]   ?? "rgba(196,198,207,0.3)";
  const expiry = isExpiringSoon(d);
  const formattedDate = d.date
    ? new Date(d.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  const fileLabel = d.fileType?.toUpperCase() ?? "—";

  return (
    <div className={`bg-white rounded-2xl p-6 flex flex-col justify-between border border-[rgba(196,198,207,0.3)] transition-all hover:border-[#13696a] group${wide ? " lg:col-span-2" : ""}`}
      style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>

      {/* Top row */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
            <span className="material-symbols-outlined text-[#002045] text-3xl">{icon}</span>
          </div>
          <div>
            <h3 className="font-bold text-[#002045] text-base leading-snug">{d.docType}</h3>
            {d.fileName && <p className="text-xs text-[#74777f] truncate max-w-[200px]">{d.fileName}</p>}
            <p className="text-xs text-[#43474e]">
              Para: <span className="font-semibold text-[#181c1e]">{d.personaName}</span>
              {d.personaRole && ` (${d.personaRole})`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {d.aiProcess && d.aiReady !== false && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold"
              style={{ backgroundColor: "rgba(162,237,237,0.3)", borderColor: "#89d3d4", color: "#13696a" }}>
              <span className="material-symbols-outlined text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              IA Lista
            </span>
          )}
          {d.aiProcess && d.aiReady === false && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-semibold"
              style={{ backgroundColor: "#f1f4f6", borderColor: "#c4c6cf", color: "#43474e" }}>
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Procesando
            </span>
          )}
          {expiry && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: "#ffdad6", color: "#93000a" }}>
              {expiry}
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#43474e] mb-5">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          {formattedDate}
        </span>
        {d.doctor && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">stethoscope</span>
            {d.doctor}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">
            {d.fileType === "pdf" ? "picture_as_pdf" : "image"}
          </span>
          {fileLabel}
        </span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 pt-4 border-t border-[#e0e3e5]">
        <ActionBtn icon="visibility" label="Ver"
          onClick={() => window.open(d.downloadURL, "_blank")} />
        <ActionBtn icon="download" label="Bajar"
          onClick={() => {
            const a = document.createElement("a");
            a.href = d.downloadURL; a.download = d.fileName; a.click();
          }} />
        <ActionBtn icon="share" label="Compartir" onClick={onShare} />
        <ActionBtn icon="print" label="Imprimir"
          onClick={() => { const w = window.open(d.downloadURL); w?.print(); }} />

        {/* IA Resumen */}
        {d.aiProcess ? (
          <button
            className="flex flex-col items-center gap-1 p-2 rounded-lg transition-colors col-span-3 md:col-span-1"
            style={{ backgroundColor: "rgba(162,237,237,0.3)", color: "#1a6d6e" }}
            onClick={() => alert("Función IA próximamente disponible.")}>
            <span className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
            <span className="text-[10px] font-bold">IA Resumen</span>
          </button>
        ) : (
          <button disabled
            className="flex flex-col items-center gap-1 p-2 rounded-lg col-span-3 md:col-span-1 opacity-40 cursor-not-allowed"
            style={{ backgroundColor: "#f1f4f6", color: "#43474e" }}>
            <span className="material-symbols-outlined">summarize</span>
            <span className="text-[10px] font-bold">Sin IA</span>
          </button>
        )}
      </div>

      {/* Delete */}
      <button onClick={onDelete} disabled={deleting}
        className="mt-3 flex items-center gap-1 text-xs text-[#74777f] hover:text-[#ba1a1a] transition-colors self-end disabled:opacity-40">
        {deleting
          ? <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
          : <span className="material-symbols-outlined text-[14px]">delete</span>}
        Eliminar
      </button>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[#f1f4f6] transition-colors active:opacity-50">
      <span className="material-symbols-outlined text-[#002045]">{icon}</span>
      <span className="text-[10px] font-bold text-[#002045]">{label}</span>
    </button>
  );
}

function FilterSelect({ label, icon, value, onChange, options }: {
  label: string; icon: string; value: string;
  onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="relative">
      <label className="text-xs text-[#43474e] font-medium mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#f1f4f6] border-none rounded-xl py-3 px-4 text-[#181c1e] appearance-none text-sm">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="material-symbols-outlined absolute right-3 bottom-3 text-[#74777f] pointer-events-none text-[18px]">{icon}</span>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="w-16 h-16 bg-[#ebeef0] rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-[#74777f] text-3xl">folder_zip</span>
      </div>
      <p className="text-[#43474e] font-semibold">No hay documentos que mostrar para estos filtros.</p>
      <button onClick={onClear} className="text-[#13696a] font-bold hover:underline">
        Limpiar filtros
      </button>
    </div>
  );
}
