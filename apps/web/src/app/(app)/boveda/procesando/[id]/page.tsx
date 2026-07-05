"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { explainDocument } from "@/lib/api/client";

const STEPS = [
  { icon: "check",         label: "Archivo recibido",                  dur: 0    },
  { icon: "check",         label: "Verificando seguridad",             dur: 1200 },
  { icon: "auto_awesome",  label: "Identificando fechas y diagnósticos", dur: 2800 },
  { icon: "category",      label: "Clasificando documento",            dur: 5000 },
  { icon: "account_tree",  label: "Organizando información",           dur: 7200 },
  { icon: "summarize",     label: "Preparando resumen",                dur: 9000 },
];

const ACTIVE_LABELS = [
  "Extrayendo texto…",
  "Identificando fechas y diagnósticos…",
  "Validando con la base de datos médica…",
  "Generando índice cronológico…",
];

type StepStatus = "done" | "active" | "pending";

function stepStatus(index: number, activeIndex: number): StepStatus {
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "active";
  return "pending";
}

export default function ProcesandoPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(0);
  const [activeLabelIdx, setActiveLabelIdx] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Advance steps according to their durations
    STEPS.forEach((step, i) => {
      if (step.dur === 0) return;
      const t = setTimeout(() => setActiveStep(i), step.dur);
      timerRef.current.push(t);
    });

    // Rotate active label every 3s
    const labelInterval = setInterval(
      () => setActiveLabelIdx((prev) => (prev + 1) % ACTIVE_LABELS.length),
      3000
    );

    // Mark done: llama a la IA y guarda resumen en Firestore
    const finishTimer = setTimeout(async () => {
      const uid = auth.currentUser?.uid;
      if (uid && id) {
        try {
          const snap = await getDoc(doc(db, "users", uid, "documents", id));
          const data = snap.data() ?? {};
          const extractedText: string = data.extractedText ?? "";
          if (extractedText) {
            await explainDocument({
              doc_id: id,
              extracted_text: extractedText,
              doc_type: data.docType ?? "Documento médico",
            }).catch(() => {
              // Si la IA falla, al menos marcamos aiReady para no quedar en bucle
              updateDoc(doc(db, "users", uid, "documents", id), { aiReady: true }).catch(() => {});
            });
          } else {
            await updateDoc(doc(db, "users", uid, "documents", id), { aiReady: true });
          }
        } catch {
          // Non-blocking
        }
      }
      setDone(true);
    }, STEPS[STEPS.length - 1].dur + 1500);

    timerRef.current.push(finishTimer);
    return () => { timerRef.current.forEach(clearTimeout); clearInterval(labelInterval); };
  }, [id]);

  // Redirect once done
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => router.replace(`/boveda/${id}`), 800);
      return () => clearTimeout(t);
    }
  }, [done, id, router]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full mx-auto">

        {/* Spinner / Done icon */}
        <div className="flex flex-col items-center mb-10">
          {done ? (
            <span className="material-symbols-outlined text-[#13696a] mb-6"
              style={{ fontSize: 72, fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          ) : (
            <LoadingRing />
          )}

          <h2 className="text-2xl md:text-[32px] font-bold text-[#002045] text-center mb-3"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            {done ? "¡Documento listo!" : "Analizando tu Documento"}
          </h2>
          <p className="text-base text-[#43474e] text-center max-w-sm">
            {done
              ? "La IA organizó tu documento. Redirigiendo…"
              : "Estamos organizando tu documento. Podrás revisar y corregir la información en unos segundos."}
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-3">
          {STEPS.map((step, i) => {
            const status = stepStatus(i, done ? STEPS.length : activeStep);
            return (
              <StepRow
                key={i}
                icon={step.icon}
                label={status === "active" ? ACTIVE_LABELS[activeLabelIdx] : step.label}
                status={status}
              />
            );
          })}
        </div>

        {/* Security footer */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{ backgroundColor: "rgba(0,32,69,0.05)", borderColor: "rgba(0,32,69,0.1)" }}>
            <span className="material-symbols-outlined text-[#002045] text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <span className="text-xs font-bold text-[#002045] uppercase tracking-widest">
              Encriptación de Nivel Médico
            </span>
          </div>
          <p className="text-[11px] text-[#43474e] text-center opacity-70">
            Tus datos están protegidos por leyes de privacidad de salud y nunca se comparten con terceros.
          </p>
        </div>
      </div>

      {/* Desktop aside */}
      <aside className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 w-72">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/30 space-y-4"
          style={{ boxShadow: "0 8px 32px rgba(26,54,93,0.12)" }}>
          <div className="flex items-center gap-2 text-[#13696a]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            <h3 className="text-sm font-bold">IA Responsable</h3>
          </div>
          <p className="text-xs text-[#43474e] leading-relaxed">
            Nuestra IA está diseñada para asistir en la organización de tu historial clínico, permitiendo que la información vital sea accesible cuando más se necesita.
          </p>
          <div className="pt-4 border-t border-[#e0e3e5]">
            <div className="w-full h-28 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(162,237,237,0.15)" }}>
              <span className="material-symbols-outlined text-[#13696a] text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>health_metrics</span>
            </div>
          </div>
          <p className="text-[10px] text-[#74777f] text-center italic">
            La IA no reemplaza el diagnóstico médico profesional.
          </p>
        </div>
      </aside>
    </div>
  );
}

function StepRow({ icon, label, status }: { icon: string; label: string; status: StepStatus }) {
  const isDone   = status === "done";
  const isActive = status === "active";
  const isPending = status === "pending";

  return (
    <div
      className={`rounded-xl p-4 flex items-center justify-between border-l-4 transition-all duration-500${
        isPending ? " opacity-50" : ""
      }`}
      style={{
        backgroundColor: isDone
          ? "rgba(255,255,255,0.7)"
          : isActive
          ? "#ffffff"
          : "rgba(241,244,246,0.5)",
        backdropFilter: isDone || isActive ? "blur(12px)" : "none",
        borderLeftColor: isDone ? "#13696a" : isActive ? "#002045" : "transparent",
        boxShadow: isActive ? "0 4px 16px rgba(26,54,93,0.1)" : undefined,
      }}>
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center${isActive ? " animate-pulse" : ""}`}
          style={{
            backgroundColor: isDone
              ? "rgba(162,237,237,0.5)"
              : isActive
              ? "#1a365d"
              : "#ebeef0",
          }}>
          <span className="material-symbols-outlined text-sm"
            style={{
              fontVariationSettings: isDone ? "'wght' 700" : isActive ? "'FILL' 1" : "'FILL' 0",
              color: isDone ? "#13696a" : isActive ? "#adc7f7" : "#74777f",
            }}>
            {isDone ? "check" : icon}
          </span>
        </div>
        <span className="text-sm font-semibold transition-all duration-300"
          style={{ color: isPending ? "#74777f" : "#002045" }}>
          {label}
        </span>
      </div>

      {isDone && (
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#13696a" }}>
          Completado
        </span>
      )}
      {isActive && (
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: "#002045", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      )}
      {isPending && (
        <span className="material-symbols-outlined text-[#74777f] text-sm">pending</span>
      )}
    </div>
  );
}

function LoadingRing() {
  return (
    <div className="relative w-20 h-20 mb-6">
      {["-0.45s", "-0.3s", "-0.15s", "0s"].map((delay, i) => (
        <div key={i} className="absolute inset-0 rounded-full"
          style={{
            width: 64, height: 64, margin: 8,
            border: "4px solid transparent",
            borderTopColor: "#13696a",
            borderRadius: "50%",
            animation: `spin 1.2s cubic-bezier(0.5,0,0.5,1) ${delay} infinite`,
          }} />
      ))}
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
