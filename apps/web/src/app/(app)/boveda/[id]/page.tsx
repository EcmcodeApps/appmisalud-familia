"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc, getDoc, collection, getDocs, query, orderBy, limit,
  addDoc, serverTimestamp, deleteDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase/config";
import { explainDocument, type AIExplainResponse } from "@/lib/api/client";
import { useTrialStatus } from "@/lib/hooks/useTrialStatus";

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
  extractedText?: string;
  aiSummary?: string;
  aiKeyFindings?: string[];
  aiSuggestions?: string[];
}

interface Note { id: string; text: string; createdAt: string; }
interface RelatedDoc { id: string; docType: string; date: string; }

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DetalleDocumentoPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [doc_, setDoc_] = useState<MedDoc | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [related, setRelated] = useState<RelatedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [aiResult, setAiResult] = useState<AIExplainResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const { trial } = useTrialStatus();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { router.replace("/login"); return; }

    Promise.all([
      getDoc(doc(db, "users", uid, "documents", id)),
      getDocs(query(collection(db, "users", uid, "documents", id, "notes"), orderBy("createdAt", "asc"))),
    ]).then(([docSnap, notesSnap]) => {
      if (!docSnap.exists()) { router.replace("/boveda"); return; }
      const data = { id: docSnap.id, ...docSnap.data() } as MedDoc;
      setDoc_(data);

      setNotes(notesSnap.docs.map((n) => ({
        id: n.id,
        text: n.data().text as string,
        createdAt: n.data().createdAt?.toDate?.()?.toLocaleString("es-CO") ?? "",
      })));

      // Load related docs for same persona
      if (data.personaId) {
        getDocs(
          query(
            collection(db, "users", uid, "documents"),
            orderBy("createdAt", "desc"),
            limit(10)
          )
        ).then((snap) => {
          const rel = snap.docs
            .filter((d) => d.id !== id && d.data().personaId === data.personaId)
            .slice(0, 3)
            .map((d) => ({ id: d.id, docType: d.data().docType, date: d.data().date }));
          setRelated(rel);
        });
      }
      setLoading(false);
    });
  }, [id, router]);

  async function handleExplain() {
    if (trial?.isExpired) {
      setAiError("Tu prueba gratuita finalizó. Activa el plan económico para generar resúmenes con IA.");
      return;
    }
    if (!doc_?.extractedText) {
      setAiError("Este documento no tiene texto extraído. Súbelo de nuevo con IA activada.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    try {
      const res = await explainDocument({
        doc_id: doc_.id,
        extracted_text: doc_.extractedText,
        doc_type: doc_.docType,
      });
      setAiResult(res);
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : "Error al contactar la IA.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setAddingNote(true);
    const ref_ = await addDoc(
      collection(db, "users", uid, "documents", id, "notes"),
      { text: newNote.trim(), createdAt: serverTimestamp() }
    );
    setNotes((prev) => [...prev, {
      id: ref_.id, text: newNote.trim(),
      createdAt: new Date().toLocaleString("es-CO"),
    }]);
    setNewNote("");
    setAddingNote(false);
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${doc_?.fileName}"? Esta acción no se puede deshacer.`)) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setDeleting(true);
    await deleteDoc(doc(db, "users", uid, "documents", id));
    if (doc_?.storagePath) await deleteObject(ref(storage, doc_?.storagePath));
    router.replace("/boveda");
  }

  function handleShare() {
    if (navigator.share && doc_) {
      navigator.share({ title: doc_.docType, url: doc_.downloadURL });
    } else {
      setShowShare(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-[#002045] text-5xl animate-pulse"
          style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
      </div>
    );
  }

  if (!doc_) return null;

  const isPdf = doc_.fileType?.toLowerCase() === "pdf";
  const isImage = ["jpg","jpeg","png","webp","gif"].includes(doc_.fileType?.toLowerCase() ?? "");

  return (
    <>
      {/* Sub-header */}
      <div className="sticky top-16 z-40 flex items-center justify-between px-4 md:px-12 h-14"
        style={{ backgroundColor: "rgba(247,250,252,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(196,198,207,0.3)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#ebeef0] transition-colors shrink-0">
            <span className="material-symbols-outlined text-[#002045]">arrow_back</span>
          </button>
          <div className="min-w-0">
            <p className="font-bold text-base text-[#002045] truncate"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              {doc_.docType}
            </p>
            <p className="text-xs text-[#43474e]">
              {doc_.personaName} · {formatDate(doc_.date)}
            </p>
          </div>
        </div>
        <button onClick={handleShare}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white shrink-0"
          style={{ backgroundColor: "#002045" }}>
          <span className="material-symbols-outlined text-[18px]">share</span>
          Compartir
        </button>
      </div>

      <main className="px-4 md:px-12 max-w-[1120px] mx-auto py-6 space-y-6">

        {/* Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
              style={{ backgroundColor: "#d6e3ff", color: "#001b3c" }}>
              <span className="material-symbols-outlined text-[14px]">folder_managed</span>
              {doc_.docType}
            </span>
            {doc_.aiReady && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                style={{ backgroundColor: "rgba(162,237,237,0.5)", color: "#1a6d6e" }}>
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Verificado
              </span>
            )}
          </div>
          {doc_.aiProcess && doc_.aiReady && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#c3e8fd", color: "#001e2b" }}>
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              Resumen IA disponible
            </span>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left col */}
          <div className="lg:col-span-8 space-y-4">

            {/* Document preview */}
            <div className="bg-[#f1f4f6] rounded-2xl overflow-hidden relative group"
              style={{ aspectRatio: "4/3", boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              {isPdf ? (
                <iframe src={doc_.downloadURL} className="w-full h-full" title="Documento" />
              ) : isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={doc_.downloadURL} alt={doc_.docType}
                  className="w-full h-full object-contain opacity-90" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-[#13696a] text-6xl">description</span>
                  <p className="text-sm text-[#43474e]">{doc_.fileName}</p>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#002045]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button onClick={() => window.open(doc_.downloadURL, "_blank")}
                  className="bg-white text-[#002045] px-6 py-3 rounded-full font-bold flex items-center gap-2"
                  style={{ boxShadow: "0 8px 24px rgba(0,32,69,0.2)" }}>
                  <span className="material-symbols-outlined">zoom_in</span>
                  Ver Pantalla Completa
                </button>
              </div>

              {/* File type badge */}
              <div className="absolute top-4 left-4 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: "#ba1a1a" }}>
                {doc_.fileType?.toUpperCase() ?? "DOC"}
              </div>
            </div>

            {/* Action bar */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <ActionBtn icon="download" label="Descargar"
                onClick={() => { const a = document.createElement("a"); a.href = doc_.downloadURL; a.download = doc_.fileName; a.click(); }} />
              <ActionBtn icon="share" label="Compartir" onClick={handleShare} />
              <ActionBtn icon="print" label="Imprimir"
                onClick={() => { const w = window.open(doc_.downloadURL); w?.print(); }} />
              <ActionBtn icon="auto_awesome" label="Resumir" teal
                onClick={handleExplain} disabled={aiLoading} />
              <ActionBtn icon="drive_file_move" label="Mover"
                onClick={() => alert("Próximamente.")} />
              <ActionBtn icon="delete" label="Eliminar" danger
                onClick={handleDelete} disabled={deleting} />
            </div>

            {/* Extracted data */}
            <div className="bg-white rounded-2xl p-6 border border-[rgba(196,198,207,0.3)]"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <h3 className="font-bold text-xl text-[#002045] mb-4 flex items-center gap-2"
                style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                <span className="material-symbols-outlined text-[#13696a]">clinical_notes</span>
                Datos Extraídos
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <DataField label="Institución" value={doc_.institution || "—"} />
                <DataField label="Médico solicitante" value={doc_.doctor || "—"} />
                <DataField label="Tipo de documento" value={doc_.docType} />
                <DataField label="Persona" value={`${doc_.personaName}${doc_.personaRole ? ` (${doc_.personaRole})` : ""}`} />
                {doc_.notes && (
                  <div className="md:col-span-2">
                    <DataField label="Notas originales" value={doc_.notes} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="lg:col-span-4 space-y-4">

            {/* AI Summary */}
            <div className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #133a4a 0%, #1a365d 100%)",
                boxShadow: "0px 4px 20px rgba(26,54,93,0.08)",
              }}>
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl opacity-10"
                style={{ backgroundColor: "#13696a" }} />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-bold text-xl text-white flex items-center gap-2"
                  style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Resumen IA
                </h3>
                <span className="material-symbols-outlined text-[#a5eff0] cursor-help" title="La IA asiste en la interpretación, no sustituye el juicio médico.">info</span>
              </div>
              {/* Estado de carga */}
              {aiLoading && (
                <p className="text-white/70 text-sm relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  La IA está analizando el documento…
                </p>
              )}

              {/* Error */}
              {!aiLoading && aiError && (
                <p className="text-red-300 text-sm relative z-10">{aiError}</p>
              )}

              {/* Resultado en vivo o desde Firestore */}
              {!aiLoading && !aiError && (() => {
                const summary = aiResult?.summary ?? doc_.aiSummary;
                const findings = aiResult?.key_findings ?? doc_.aiKeyFindings ?? [];
                const disclaimer = aiResult?.disclaimer;
                if (summary) return (
                  <div className="space-y-3 relative z-10">
                    <p className="text-white/90 text-sm leading-relaxed">{summary}</p>
                    {findings.length > 0 && (
                      <ul className="space-y-1">
                        {findings.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/80">
                            <span className="material-symbols-outlined text-[#a5eff0] text-[14px] mt-0.5 shrink-0">check_circle</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    {disclaimer && (
                      <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-[11px] text-white/50">
                        <span className="material-symbols-outlined text-[13px] shrink-0 mt-0.5">info</span>
                        {disclaimer}
                      </div>
                    )}
                  </div>
                );
                if (doc_.aiProcess && !doc_.aiReady) return (
                  <p className="text-white/70 text-sm relative z-10 flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    La IA está procesando este documento…
                  </p>
                );
                return (
                  <p className="text-white/70 text-sm relative z-10">
                    {doc_.aiProcess
                      ? "Presiona \"Resumir\" para generar el análisis IA."
                      : "Este documento no tiene procesamiento IA activado."}
                  </p>
                );
              })()}
            </div>

            {/* Caregiver notes */}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-[#13696a] border border-[rgba(196,198,207,0.3)]"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#002045] mb-4">
                Notas del Gestor
              </h3>
              <div className="space-y-3">
                {notes.length === 0 && (
                  <p className="text-xs text-[#74777f] italic">Sin notas todavía.</p>
                )}
                {notes.map((n) => (
                  <div key={n.id} className="p-3 bg-[#f7fafc] rounded-xl text-sm italic text-[#43474e] relative">
                    "{n.text}"
                    {n.createdAt && (
                      <div className="mt-1 text-[10px] font-bold text-[#74777f] uppercase">{n.createdAt}</div>
                    )}
                  </div>
                ))}

                {/* Add note */}
                <div className="space-y-2">
                  <textarea
                    value={newNote} onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="w-full p-3 text-sm border border-dashed border-[#c4c6cf] rounded-xl resize-none bg-[#f7fafc] focus:border-[#13696a] focus:outline-none"
                    placeholder="Añadir una nota…" />
                  <button onClick={handleAddNote} disabled={addingNote || !newNote.trim()}
                    className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border-2 border-dashed border-[#c4c6cf] text-[#43474e] hover:border-[#13696a] hover:text-[#13696a] transition-colors disabled:opacity-40">
                    {addingNote
                      ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined text-[18px]">add</span>}
                    Añadir Nota
                  </button>
                </div>
              </div>
            </div>

            {/* Related documents */}
            {related.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[rgba(196,198,207,0.3)]"
                style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#002045] mb-4">
                  Documentos Relacionados
                </h3>
                <div className="space-y-2">
                  {related.map((r) => (
                    <Link key={r.id} href={`/boveda/${r.id}`}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f1f4f6] transition-colors group">
                      <div className="w-10 h-10 bg-[#ebeef0] rounded-lg flex items-center justify-center group-hover:bg-[#1a365d] transition-colors">
                        <span className="material-symbols-outlined text-[#43474e] group-hover:text-white transition-colors">description</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#002045]">{r.docType}</p>
                        <p className="text-xs text-[#43474e]">{formatDate(r.date)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Share modal */}
      {showShare && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
          onClick={() => setShowShare(false)}>
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,32,69,0.2)", backdropFilter: "blur(4px)" }} />
          <div className="relative bg-white rounded-t-3xl md:rounded-3xl p-6 w-full md:max-w-md"
            style={{ boxShadow: "0 24px 48px rgba(0,32,69,0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div className="w-12 h-1.5 bg-[#c4c6cf] rounded-full mx-auto mb-5 md:hidden" />
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-xl text-[#002045]"
                style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                Compartir Documento
              </h2>
              <button onClick={() => setShowShare(false)}
                className="p-2 rounded-full hover:bg-[#ebeef0]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-5">
              {[
                { label: "WhatsApp", bg: "rgba(37,211,102,0.1)", content: (
                  <span className="material-symbols-outlined text-[#25D366] text-3xl">chat</span>
                ), action: () => window.open(`https://wa.me/?text=${encodeURIComponent(doc_.downloadURL)}`) },
                { label: "Email", bg: "rgba(0,32,69,0.08)", content: (
                  <span className="material-symbols-outlined text-[#002045] text-3xl">mail</span>
                ), action: () => window.open(`mailto:?body=${encodeURIComponent(doc_.downloadURL)}`) },
                { label: "Copiar link", bg: "rgba(19,105,106,0.08)", content: (
                  <span className="material-symbols-outlined text-[#13696a] text-3xl">link</span>
                ), action: () => { navigator.clipboard.writeText(doc_.downloadURL); alert("Enlace copiado."); } },
                { label: "Más", bg: "#ebeef0", content: (
                  <span className="material-symbols-outlined text-[#43474e] text-3xl">more_horiz</span>
                ), action: () => navigator.share?.({ url: doc_.downloadURL }) },
              ].map((s) => (
                <button key={s.label} onClick={s.action}
                  className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: s.bg }}>
                    {s.content}
                  </div>
                  <span className="text-xs text-[#43474e] font-medium">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(19,105,106,0.2)]"
              style={{ backgroundColor: "rgba(162,237,237,0.1)" }}>
              <span className="material-symbols-outlined text-[#13696a]">security</span>
              <p className="text-xs text-[#13696a] font-medium">
                El archivo se compartirá como un enlace seguro con vencimiento en 24h.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionBtn({ icon, label, onClick, teal, danger, disabled }: {
  icon: string; label: string; onClick: () => void;
  teal?: boolean; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all active:scale-95 hover:opacity-90 group disabled:opacity-40"
      style={{
        backgroundColor: teal ? "rgba(162,237,237,0.3)" : "white",
        boxShadow: "0px 4px 20px rgba(26,54,93,0.08)",
      }}>
      <span className="material-symbols-outlined group-hover:scale-110 transition-transform"
        style={{ color: danger ? "#ba1a1a" : teal ? "#13696a" : "#002045" }}>
        {icon}
      </span>
      <span className="text-[11px] font-bold"
        style={{ color: danger ? "#ba1a1a" : teal ? "#13696a" : "#002045" }}>
        {label}
      </span>
    </button>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-widest text-[#43474e]">{label}</p>
      <p className="font-semibold text-[#002045]">{value}</p>
    </div>
  );
}
