"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { summarizeDocuments, explainDocument, type AISummarizeResponse } from "@/lib/api/client";

interface Persona { id: string; name: string; role: string; birthDate?: string; sex?: string; }
interface MedDoc  { id: string; docType: string; date: string; fileName: string; extractedText?: string; }

type MessageRole = "user" | "ai";

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  aiData?: AISummarizeResponse & { doc_type?: string; key_findings?: string[]; follow_up_suggestions?: string[]; summary: string; disclaimer: string; };
  error?: string;
}

const QUICK_PROMPTS = [
  { icon: "history_edu", label: "Resume la historia de mi familiar" },
  { icon: "lab_research", label: "Explícame los documentos recientes" },
  { icon: "emergency",    label: "Prepara resumen para urgencias" },
];

function calcAgeRange(birthDate?: string): string | undefined {
  if (!birthDate) return undefined;
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / 31557600000);
  if (age < 2)  return "menor de 2 años";
  if (age < 12) return `niño de ${age} años`;
  if (age < 18) return `adolescente de ${age} años`;
  if (age < 60) return `adulto de ${age} años`;
  return `adulto mayor de ${age} años`;
}

export default function AsistentePage() {
  const router = useRouter();
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [personas,       setPersonas]       = useState<Persona[]>([]);
  const [docs,           setDocs]           = useState<MedDoc[]>([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [messages,       setMessages]       = useState<ChatMessage[]>([]);
  const [input,          setInput]          = useState("");
  const [thinking,       setThinking]       = useState(false);
  const [displayName,    setDisplayName]    = useState("Usuario");

  // Load data
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { router.replace("/login"); return; }
    setDisplayName(auth.currentUser?.displayName?.split(" ")[0] ?? "Usuario");

    getDocs(query(collection(db, "users", uid, "personas"), orderBy("createdAt", "asc")))
      .then((snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id, name: d.data().name, role: d.data().role,
          birthDate: d.data().birthDate, sex: d.data().sex,
        })) as Persona[];
        setPersonas(list);
        if (list.length) setSelectedPersona(list[0].id);
      });

    getDocs(query(collection(db, "users", uid, "documents"), orderBy("createdAt", "desc")))
      .then((snap) => {
        setDocs(snap.docs.map((d) => ({
          id: d.id, docType: d.data().docType, date: d.data().date,
          fileName: d.data().fileName, extractedText: d.data().extractedText,
        })) as MedDoc[]);
      });
  }, [router]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function addMessage(msg: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID() }]);
  }

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || thinking) return;

    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }

    addMessage({ role: "user", text });
    setThinking(true);

    const persona = personas.find((p) => p.id === selectedPersona);
    const personaDocs = docs.filter((d) => d.id); // all docs — could filter by personaId if stored

    try {
      // Use summarize when we have multiple docs, explain for single
      const docIds = personaDocs.filter((d) => d.extractedText).slice(0, 10).map((d) => d.id);

      if (docIds.length === 0) {
        addMessage({
          role: "ai",
          text: "",
          error: "No hay documentos con texto extraído todavía. Sube documentos con IA activada para que el asistente pueda analizarlos.",
        });
        return;
      }

      const res = await summarizeDocuments({
        doc_ids: docIds,
        age_range: calcAgeRange(persona?.birthDate),
        biological_sex: persona?.sex,
      });

      addMessage({ role: "ai", text: "", aiData: res as ChatMessage["aiData"] });
    } catch (e: unknown) {
      addMessage({
        role: "ai", text: "",
        error: e instanceof Error ? e.message : "Error al conectar con la IA. Verifica que el servidor esté corriendo.",
      });
    } finally {
      setThinking(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Sub-header */}
      <div className="sticky top-16 z-40 flex items-center justify-between px-4 md:px-12 h-14 gap-3"
        style={{ backgroundColor: "rgba(247,250,252,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(196,198,207,0.3)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-[#00B8A9]"
            style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <h1 className="font-bold text-base text-[#003A7A] truncate"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            Asistente IA
          </h1>
        </div>

        {/* Persona selector */}
        {personas.length > 0 && (
          <div className="relative shrink-0">
            <select
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className="h-9 pl-3 pr-8 text-sm border border-[#c4c6cf] rounded-xl bg-white appearance-none text-[#003A7A] font-semibold">
              {personas.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1.5 text-[#74777f] text-[18px] pointer-events-none">expand_more</span>
          </div>
        )}
      </div>

      {/* Chat area */}
      <main className="flex flex-col max-w-3xl mx-auto px-4 md:px-8 pb-48 pt-6 space-y-6 min-h-[calc(100vh-8rem)]">

        {/* Welcome */}
        {showWelcome && (
          <div className="flex flex-col items-center text-center mt-8 mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: "rgba(162,237,237,0.3)", boxShadow: "0 0 15px rgba(19,105,106,0.15)" }}>
              <span className="material-symbols-outlined text-[#00B8A9] text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h2 className="text-2xl font-bold text-[#003A7A] mb-2"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Hola, {displayName}
            </h2>
            <p className="text-[#43474e] max-w-md text-sm">
              Soy tu asistente de salud familiar. Analizo los documentos de tu bóveda para darte respuestas claras. ¿En qué puedo ayudarte hoy?
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border"
              style={{ backgroundColor: "rgba(19,105,106,0.08)", borderColor: "rgba(19,105,106,0.2)" }}>
              <span className="material-symbols-outlined text-[#00B8A9] text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <span className="text-[#00B8A9] text-xs font-bold uppercase tracking-wider">IA Responsable</span>
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full text-left">
              {QUICK_PROMPTS.map((p) => (
                <button key={p.label} onClick={() => handleSend(p.label)}
                  className="p-4 bg-white rounded-2xl border border-[rgba(196,198,207,0.4)] hover:bg-[#f1f4f6] transition-all text-left group"
                  style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
                  <span className="material-symbols-outlined text-[#00B8A9] mb-2 block">{p.icon}</span>
                  <p className="text-sm font-semibold text-[#003A7A] group-hover:text-[#00B8A9]">{p.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end ml-12">
                <div className="bg-[#003A7A] text-white px-5 py-3 rounded-2xl rounded-tr-sm"
                  style={{ boxShadow: "0 4px 12px rgba(0,32,69,0.2)" }}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mr-12">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00B8A9] text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="text-xs font-bold text-[#00B8A9] uppercase tracking-wider">Asistente IA</span>
                </div>

                {msg.error ? (
                  <div className="bg-white rounded-2xl rounded-tl-sm p-5 border-l-4 border-[#ba1a1a]"
                    style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[#ba1a1a]">error</span>
                      <p className="text-sm text-[#43474e]">{msg.error}</p>
                    </div>
                  </div>
                ) : msg.aiData ? (
                  <AIResponseCard data={msg.aiData} />
                ) : null}
              </div>
            )}
          </div>
        ))}

        {/* Thinking indicator */}
        {thinking && (
          <div className="flex flex-col gap-2 mr-12">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00B8A9] text-[18px] animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-xs font-bold text-[#00B8A9] uppercase tracking-wider">Analizando…</span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm p-5 border-l-4 border-[#00B8A9]"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#00B8A9] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <p className="text-sm text-[#43474e]">Leyendo los documentos de tu bóveda…</p>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* Fixed input */}
      <div className="fixed bottom-20 md:bottom-4 left-0 w-full px-4 md:px-0 z-40">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-2 flex items-end gap-2 border border-[rgba(196,198,207,0.5)]"
            style={{ boxShadow: "0px -4px 20px rgba(26,54,93,0.08)" }}>
            <button
              className="p-3 rounded-xl text-[#74777f] hover:bg-[#ebeef0] transition-colors"
              title="Adjuntar documento"
              onClick={() => router.push("/boveda/subir")}>
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Escribe tu consulta de salud aquí…"
              className="flex-1 border-none focus:ring-0 bg-transparent py-3 resize-none text-sm placeholder:text-[#74777f]/60 text-[#003A7A]"
              style={{ outline: "none", maxHeight: "8rem", overflowY: "auto" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={thinking || !input.trim()}
              className="p-3 rounded-xl text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: "#003A7A" }}>
              {thinking
                ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined">send</span>}
            </button>
          </div>
          <p className="text-center text-[10px] text-[#74777f]/60 mt-2 hidden md:block">
            MiSalud FamilIA IA puede cometer errores. Verifica siempre la información médica crítica.
          </p>
        </div>
      </div>
    </>
  );
}

function AIResponseCard({ data }: { data: NonNullable<ChatMessage["aiData"]> }) {
  const [shared, setShared] = useState(false);

  function handleShare() {
    const text = [
      data.summary,
      ...(data.patterns ?? []),
      ...(data.recommendations ?? []),
      "",
      data.disclaimer,
    ].join("\n");
    if (navigator.share) {
      navigator.share({ title: "Resumen MiSalud FamilIA", text });
    } else {
      navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  return (
    <div className="bg-white rounded-2xl rounded-tl-sm p-6 border-l-4 border-[#00B8A9] space-y-5"
      style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>

      {/* Disclaimer */}
      <div className="flex gap-3 p-3 rounded-xl border border-[#ba1a1a]/10"
        style={{ backgroundColor: "rgba(255,218,214,0.3)" }}>
        <span className="material-symbols-outlined text-[#ba1a1a] shrink-0">warning</span>
        <p className="text-xs italic text-[#93000a]">{data.disclaimer}</p>
      </div>

      {/* Summary */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#003A7A] flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-[16px]">description</span>
          Resumen
        </h3>
        <p className="text-sm text-[#43474e] leading-relaxed">{data.summary}</p>
      </section>

      {/* Patterns */}
      {(data.patterns ?? []).length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#003A7A] flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            Patrones Observados
          </h3>
          <ul className="space-y-2">
            {(data.patterns ?? []).map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#43474e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00B8A9] mt-2 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Key findings (from explain endpoint) */}
      {(data.key_findings ?? []).length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#003A7A] flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[16px]">search_insights</span>
            Hallazgos Clave
          </h3>
          <ul className="space-y-2">
            {(data.key_findings ?? []).map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#43474e]">
                <span className="material-symbols-outlined text-[#00B8A9] text-[16px] mt-0.5 shrink-0">check_circle</span>
                {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommendations */}
      {(data.recommendations ?? []).length > 0 && (
        <section className="p-4 rounded-xl border border-[#c3e8fd]"
          style={{ backgroundColor: "rgba(195,232,253,0.2)" }}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#002432] flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            Recomendaciones Generales
          </h3>
          <ul className="space-y-1">
            {(data.recommendations ?? []).map((r, i) => (
              <li key={i} className="text-sm text-[#002432]">• {r}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer actions */}
      <div className="pt-3 flex items-center justify-between border-t border-[rgba(196,198,207,0.3)]">
        <p className="text-[10px] text-[#74777f] italic">
          Proveedor: {data.provider ?? "IA"}
        </p>
        <button onClick={handleShare}
          className="flex items-center gap-2 text-sm font-semibold text-[#00B8A9] hover:underline">
          <span className="material-symbols-outlined text-[18px]">share</span>
          {shared ? "¡Copiado!" : "Compartir con Médico"}
        </button>
      </div>
    </div>
  );
}
