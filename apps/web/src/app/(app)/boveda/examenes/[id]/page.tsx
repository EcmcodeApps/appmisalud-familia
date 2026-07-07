"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { explainDocument, type AIExplainResponse } from "@/lib/api/client";
import { useTrialStatus } from "@/lib/hooks/useTrialStatus";

interface MedDoc {
  id: string;
  personaName: string;
  personaRole: string;
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

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CO", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function DetalleExamenPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const [doc_, setDoc_]           = useState<MedDoc | null>(null);
  const [loading, setLoading]     = useState(true);
  const [aiResult, setAiResult]   = useState<AIExplainResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState("");
  const { trial } = useTrialStatus();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { router.replace("/login"); return; }

    getDoc(doc(db, "users", uid, "documents", id)).then((snap) => {
      if (!snap.exists()) { router.replace("/boveda"); return; }
      setDoc_({ id: snap.id, ...snap.data() } as MedDoc);
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

  function handleShare() {
    if (navigator.share && doc_) {
      navigator.share({ title: doc_.docType, url: doc_.downloadURL });
    } else if (doc_) {
      navigator.clipboard.writeText(doc_.downloadURL);
      alert("Enlace copiado al portapapeles.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-[#003A7A] text-5xl animate-pulse"
          style={{ fontVariationSettings: "'FILL' 1" }}>health_metrics</span>
      </div>
    );
  }

  if (!doc_) return null;

  // Datos IA — prioriza resultado en vivo, luego Firestore
  const summary   = aiResult?.summary    ?? doc_.aiSummary  ?? null;
  const findings  = aiResult?.key_findings  ?? doc_.aiKeyFindings  ?? [];
  const suggestions = aiResult?.follow_up_suggestions ?? doc_.aiSuggestions ?? [];
  const disclaimer  = aiResult?.disclaimer ?? null;
  const hasAI = !!(summary || findings.length);

  return (
    <>
      {/* Sub-header */}
      <div className="sticky top-16 z-40 flex items-center justify-between px-4 md:px-12 h-14 gap-3"
        style={{ backgroundColor: "rgba(247,250,252,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(196,198,207,0.3)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#ebeef0] transition-colors shrink-0">
            <span className="material-symbols-outlined text-[#003A7A]">arrow_back</span>
          </button>
          <div className="min-w-0">
            <nav className="flex items-center gap-1 text-xs text-[#74777f] mb-0.5">
              <Link href="/boveda" className="hover:text-[#003A7A]">Bóveda</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span>{doc_.docType}</span>
            </nav>
            <p className="font-bold text-sm text-[#003A7A] truncate"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              {doc_.fileName}
            </p>
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button onClick={handleExplain} disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
            style={{ backgroundColor: "#003A7A" }}>
            {aiLoading
              ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              : <span className="material-symbols-outlined text-[18px]">auto_awesome</span>}
            {aiLoading ? "Analizando…" : "Generar resumen médico"}
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors hover:bg-[#B3EDE8]/20"
            style={{ color: "#00B8A9", borderColor: "#00B8A9" }}>
            <span className="material-symbols-outlined text-[18px]">share</span>
            Compartir
          </button>
        </div>
      </div>

      <main className="px-4 md:px-12 max-w-[1120px] mx-auto py-6 space-y-6">

        {/* Title row */}
        <section className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-[32px] font-bold text-[#003A7A]"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            {doc_.docType}
          </h1>
          <p className="text-sm text-[#43474e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            {formatDate(doc_.date)}
            {doc_.institution && <> · {doc_.institution}</>}
            {doc_.doctor && <> · {doc_.doctor}</>}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "#d6e3ff", color: "#001b3c" }}>
              {doc_.personaName} {doc_.personaRole ? `· ${doc_.personaRole}` : ""}
            </span>
            {doc_.aiReady && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
                style={{ backgroundColor: "rgba(162,237,237,0.5)", color: "#00968A" }}>
                <span className="material-symbols-outlined text-[14px]">verified</span>
                IA procesado
              </span>
            )}
          </div>
        </section>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* AI Findings — main column */}
          <div className="md:col-span-8 space-y-5">

            {/* Error */}
            {aiError && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border border-[#ba1a1a]/20"
                style={{ backgroundColor: "rgba(255,218,214,0.3)" }}>
                <span className="material-symbols-outlined text-[#ba1a1a] shrink-0">error</span>
                <p className="text-sm text-[#93000a]">{aiError}</p>
              </div>
            )}

            {/* Findings table */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(196,198,207,0.3)]"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <div className="px-6 py-4 border-b border-[#ebeef0] bg-[#f1f4f6] flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-bold text-lg text-[#003A7A]"
                  style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                  Hallazgos del Examen
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => { const a = document.createElement("a"); a.href = doc_.downloadURL; a.download = doc_.fileName; a.click(); }}
                    className="flex items-center gap-1 text-sm font-semibold text-[#00B8A9] hover:underline">
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Descargar PDF
                  </button>
                  <button onClick={() => { const w = window.open(doc_.downloadURL); w?.print(); }}
                    className="flex items-center gap-1 text-sm font-semibold text-[#00B8A9] hover:underline">
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    Imprimir
                  </button>
                </div>
              </div>

              {hasAI ? (
                <div className="divide-y divide-[#ebeef0]">
                  {/* Summary row */}
                  {summary && (
                    <div className="px-6 py-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#43474e] mb-2">Resumen General</p>
                      <p className="text-sm text-[#003A7A] leading-relaxed">{summary}</p>
                    </div>
                  )}

                  {/* Key findings as table rows */}
                  {findings.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[#f7fafc]">
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#74777f]">#</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#74777f]">Hallazgo</th>
                            <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#74777f]">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ebeef0]">
                          {findings.map((f, i) => {
                            const isAlert = /alto|elevado|aumentado|fuera|anormal|positivo|riesgo/i.test(f);
                            const isOk    = /normal|dentro|óptimo|adecuado|negativo|sin/i.test(f);
                            return (
                              <tr key={i} className="hover:bg-[#f1f4f6] transition-colors">
                                <td className="px-6 py-4 text-sm text-[#74777f]">{i + 1}</td>
                                <td className="px-6 py-4 text-sm text-[#003A7A] leading-relaxed">{f}</td>
                                <td className="px-6 py-4">
                                  {isAlert ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                      style={{ backgroundColor: "#ffdad6", color: "#93000a" }}>
                                      Atención
                                    </span>
                                  ) : isOk ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                      style={{ backgroundColor: "rgba(162,237,237,0.5)", color: "#00968A" }}>
                                      Normal
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                      style={{ backgroundColor: "#ebeef0", color: "#43474e" }}>
                                      Revisar
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Disclaimer */}
                  {disclaimer && (
                    <div className="px-6 py-4 flex items-start gap-3 bg-[#f7fafc]">
                      <span className="material-symbols-outlined text-[#74777f] text-[18px] shrink-0 mt-0.5">info</span>
                      <p className="text-xs italic text-[#74777f]">{disclaimer}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "rgba(162,237,237,0.2)" }}>
                    <span className="material-symbols-outlined text-[#00B8A9] text-4xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}>health_metrics</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#003A7A] mb-1">Sin análisis IA todavía</p>
                    <p className="text-sm text-[#43474e]">
                      {doc_.extractedText
                        ? "Presiona \"Generar resumen médico\" para analizar este examen."
                        : "Este documento no tiene texto extraído. Súbelo de nuevo con IA activada."}
                    </p>
                  </div>
                  {doc_.extractedText && (
                    <button onClick={handleExplain} disabled={aiLoading}
                      className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-60"
                      style={{ backgroundColor: "#003A7A" }}>
                      {aiLoading
                        ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        : <span className="material-symbols-outlined">auto_awesome</span>}
                      {aiLoading ? "Analizando…" : "Generar resumen médico"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Document preview */}
            <div className="bg-white rounded-2xl overflow-hidden border border-[rgba(196,198,207,0.3)]"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <div className="px-6 py-4 border-b border-[#ebeef0]">
                <h3 className="font-bold text-base text-[#003A7A]"
                  style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
                  Documento Original
                </h3>
              </div>
              <div style={{ aspectRatio: "4/3", backgroundColor: "#f1f4f6" }}>
                {doc_.fileType?.toLowerCase() === "pdf" ? (
                  <iframe src={doc_.downloadURL} className="w-full h-full" title="Examen" />
                ) : ["jpg","jpeg","png","webp"].includes(doc_.fileType?.toLowerCase() ?? "") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc_.downloadURL} alt={doc_.docType}
                    className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-[#00B8A9] text-5xl">description</span>
                    <button onClick={() => window.open(doc_.downloadURL, "_blank")}
                      className="text-sm font-semibold text-[#003A7A] underline">
                      Abrir documento
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="md:col-span-4 space-y-5">

            {/* AI insight card */}
            <div className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #005EB8 0%, #133a4a 100%)",
                boxShadow: "0px 4px 20px rgba(26,54,93,0.12)",
              }}>
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20"
                style={{ backgroundColor: "#00B8A9" }} />
              <span className="material-symbols-outlined text-[#A5EDE8] text-4xl mb-3 block"
                style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-1">
                IA Responsable
                <span className="material-symbols-outlined text-[14px] text-white/50 cursor-help"
                  title="Esta IA analiza el texto extraído del documento para asistir su comprensión. No reemplaza el juicio médico.">
                  info
                </span>
              </h4>
              {aiLoading ? (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0,1,2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#A5EDE8] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-xs text-white/70">Analizando el examen…</p>
                </div>
              ) : summary ? (
                <p className="text-sm text-[#adc7f7] leading-relaxed">{summary}</p>
              ) : (
                <p className="text-sm text-white/60">
                  {doc_.extractedText
                    ? "Presiona \"Generar resumen médico\" para ver el análisis."
                    : "Sube este documento con IA activada para obtener análisis automático."}
                </p>
              )}
            </div>

            {/* Next steps */}
            {suggestions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[rgba(196,198,207,0.3)]"
                style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#003A7A] flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[18px] text-[#003A7A]">medication</span>
                  Próximos Pasos Sugeridos
                </h4>
                <div className="space-y-3">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ backgroundColor: "#f1f4f6" }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white"
                        style={{ backgroundColor: "#00B8A9" }}>
                        {i + 1}
                      </span>
                      <p className="text-sm text-[#003A7A] leading-snug">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical recommendation */}
            {doc_.notes && (
              <div className="bg-[#ebeef0] rounded-2xl p-6 border border-[rgba(196,198,207,0.3)]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#003A7A] flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[18px]">history_edu</span>
                  Notas del Documento
                </h4>
                <p className="text-sm text-[#43474e] leading-relaxed">{doc_.notes}</p>
              </div>
            )}

            {/* Security badge */}
            <div className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.3)] flex items-center gap-4"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#c3e8fd" }}>
                <span className="material-symbols-outlined text-[#002432]">lock</span>
              </div>
              <div>
                <p className="text-sm font-bold text-[#003A7A]">Bóveda de Seguridad</p>
                <p className="text-xs text-[#74777f]">Encriptación AES-256 activa</p>
              </div>
            </div>

            {/* Mobile: generate button */}
            <button onClick={handleExplain} disabled={aiLoading || !doc_.extractedText}
              className="md:hidden w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#003A7A", boxShadow: "0 4px 20px rgba(0,32,69,0.2)" }}>
              {aiLoading
                ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined">auto_awesome</span>}
              {aiLoading ? "Analizando…" : "Generar resumen médico"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
