"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection, addDoc, getDocs, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase/config";
import { extractDocument } from "@/lib/api/client";

const DOC_TYPES = [
  "Resultado de Laboratorio",
  "Receta Médica",
  "Radiografía / Imagen",
  "Informe de Alta",
  "Epicrisis",
  "Vacuna",
  "Otro",
];

interface PersonaOption { id: string; name: string; role: string; }

type UploadMode = "pdf" | "image" | "camera" | "scan";

export default function SubirDocumentoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [personas, setPersonas] = useState<PersonaOption[]>([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [doctor, setDoctor] = useState("");
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");
  const [aiProcess, setAiProcess] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Load personas from Firestore
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDocs(query(collection(db, "users", uid, "personas"), orderBy("createdAt", "asc")))
      .then((snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name as string,
          role: d.data().role as string,
        }));
        setPersonas(list);
        if (list.length > 0) setSelectedPersona(list[0].id);
      });
  }, []);

  function triggerUpload(mode: UploadMode) {
    if (!fileInputRef.current) return;
    if (mode === "pdf") {
      fileInputRef.current.accept = "application/pdf";
      fileInputRef.current.capture = "";
    } else if (mode === "image" || mode === "scan") {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "";
    } else {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
    }
    fileInputRef.current.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Selecciona un archivo primero."); return; }
    const uid = auth.currentUser?.uid;
    if (!uid) { router.replace("/login"); return; }

    setError("");
    setUploading(true);

    const ext = file.name.split(".").pop();
    const storagePath = `users/${uid}/documents/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { setError(err.message); setUploading(false); },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const persona = personas.find((p) => p.id === selectedPersona);
        const docRef = await addDoc(collection(db, "users", uid, "documents"), {
          personaId: selectedPersona,
          personaName: persona?.name ?? "",
          personaRole: persona?.role ?? "",
          docType,
          date,
          doctor,
          institution,
          notes,
          aiProcess,
          fileName: file.name,
          fileType: ext,
          storagePath,
          downloadURL,
          createdAt: serverTimestamp(),
        });
        setUploading(false);
        if (aiProcess) {
          // Extrae el texto en el backend (no bloqueante — procesando muestra la animación)
          extractDocument(docRef.id, file).catch(() => { /* sigue aunque falle OCR */ });
          router.replace(`/boveda/procesando/${docRef.id}`);
        } else {
          setDone(true);
        }
      }
    );
  }

  return (
    <>
      {/* Sub-header */}
      <div className="sticky top-16 z-40 flex items-center justify-between px-4 md:px-12 h-14"
        style={{ backgroundColor: "rgba(247,250,252,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(196,198,207,0.3)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#ebeef0] transition-colors active:scale-95">
            <span className="material-symbols-outlined text-[#002045]">arrow_back</span>
          </button>
          <h1 className="font-bold text-lg text-[#002045]"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            Subir documento médico
          </h1>
        </div>
        <span className="material-symbols-outlined text-[#13696a]"
          style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

      <div className="px-4 md:px-12 max-w-4xl mx-auto py-6 space-y-6">

        {/* Upload mode buttons */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UploadBtn icon="photo_camera" label="Tomar foto" primary onClick={() => triggerUpload("camera")} />
          <UploadBtn icon="picture_as_pdf" label="Subir PDF" onClick={() => triggerUpload("pdf")} />
          <UploadBtn icon="image" label="Subir imagen" onClick={() => triggerUpload("image")} />
          <UploadBtn icon="document_scanner" label="Escanear" onClick={() => triggerUpload("scan")} />
        </section>

        {/* File selected indicator */}
        {file && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#13696a]"
            style={{ backgroundColor: "rgba(162,237,237,0.15)" }}>
            <span className="material-symbols-outlined text-[#13696a]">attach_file</span>
            <span className="text-sm font-semibold text-[#002045] truncate flex-1">{file.name}</span>
            <button onClick={() => setFile(null)}
              className="material-symbols-outlined text-[#74777f] text-[18px] hover:text-[#ba1a1a]">
              close
            </button>
          </div>
        )}

        {/* Form */}
        <section className="bg-white rounded-2xl p-6 relative overflow-hidden border border-[rgba(196,198,207,0.3)]"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          {/* Accent bar */}
          <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ backgroundColor: "#13696a" }} />

          <div className="flex items-center gap-2 mb-6 pl-2">
            <span className="material-symbols-outlined text-[#13696a]"
              style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            <h2 className="font-bold text-xl text-[#002045]"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Detalles del Documento
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-2">

            {/* Persona */}
            <Field label="Persona">
              <div className="relative">
                <select value={selectedPersona} onChange={(e) => setSelectedPersona(e.target.value)}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-[#f7fafc] appearance-none">
                  {personas.length === 0 && <option value="">Sin personas registradas</option>}
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-[#74777f] pointer-events-none">expand_more</span>
              </div>
            </Field>

            {/* Tipo de documento */}
            <Field label="Tipo de documento">
              <div className="relative">
                <select value={docType} onChange={(e) => setDocType(e.target.value)}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-[#f7fafc] appearance-none">
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-[#74777f] pointer-events-none">expand_more</span>
              </div>
            </Field>

            {/* Fecha */}
            <Field label="Fecha">
              <input value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-[#f7fafc]"
                type="date" />
            </Field>

            {/* Médico */}
            <Field label="Médico">
              <input value={doctor} onChange={(e) => setDoctor(e.target.value)}
                className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-[#f7fafc]"
                placeholder="Dr. Alejandro Sanz" type="text" />
            </Field>

            {/* Institución */}
            <div className="md:col-span-2">
              <Field label="Institución">
                <input value={institution} onChange={(e) => setInstitution(e.target.value)}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-[#f7fafc]"
                  placeholder="Hospital Central · Clínica Santa María" type="text" />
              </Field>
            </div>

            {/* Notas */}
            <div className="md:col-span-2">
              <Field label="Notas">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-4 border border-[#c4c6cf] rounded-xl bg-[#f7fafc] resize-none"
                  placeholder="Añade detalles adicionales sobre este documento…" rows={3} />
              </Field>
            </div>

            {/* AI toggle */}
            <div className="md:col-span-2 flex items-start gap-4 p-4 rounded-xl border border-[#a2eded]"
              style={{ backgroundColor: "rgba(162,237,237,0.1)" }}>
              <input id="ai-process" type="checkbox" checked={aiProcess}
                onChange={(e) => setAiProcess(e.target.checked)}
                className="mt-0.5 w-5 h-5 rounded accent-[#13696a] cursor-pointer shrink-0" />
              <label htmlFor="ai-process" className="cursor-pointer">
                <div className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[#13696a] text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <span className="text-sm font-semibold text-[#002045]">
                    Permitir que la IA clasifique y organice este documento.
                  </span>
                </div>
                <p className="text-xs text-[#43474e]">
                  Nuestra tecnología extraerá automáticamente fechas y diagnósticos clave para tu historial.
                </p>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="md:col-span-2 text-sm text-[#ba1a1a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Progress bar */}
            {uploading && (
              <div className="md:col-span-2 space-y-1">
                <div className="flex justify-between text-xs text-[#43474e]">
                  <span>Subiendo…</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#ebeef0] rounded-full overflow-hidden">
                  <div className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: "#13696a" }} />
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="md:col-span-2 space-y-3 pt-2">
              <button type="submit" disabled={uploading}
                className="w-full h-14 text-white font-semibold text-base rounded-full flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-60"
                style={{ backgroundColor: "#002045", boxShadow: "0 4px 20px rgba(0,32,69,0.2)" }}>
                {uploading ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    Subir y procesar
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-2 text-[#74777f]">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span className="text-xs">Tus documentos se guardan en un espacio privado y encriptado.</span>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* Success modal */}
      {done && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(45,49,51,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white p-8 rounded-3xl max-w-xs w-full text-center space-y-4"
            style={{ boxShadow: "0 24px 48px rgba(0,32,69,0.2)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: "rgba(19,105,106,0.1)" }}>
              <span className="material-symbols-outlined text-[#13696a] text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-[#002045]"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              ¡Documento guardado!
            </h3>
            <p className="text-sm text-[#43474e]">
              {aiProcess
                ? "La IA está organizando tu archivo. Estará disponible en segundos."
                : "Tu documento ha sido guardado de forma segura en la bóveda."}
            </p>
            <button
              onClick={() => router.push("/boveda")}
              className="w-full py-3 text-white font-semibold rounded-xl"
              style={{ backgroundColor: "#002045" }}>
              Ver Bóveda
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function UploadBtn({ icon, label, primary, onClick }: {
  icon: string; label: string; primary?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex flex-col items-center justify-center p-6 rounded-2xl gap-2 active:scale-[0.97] transition-all hover:-translate-y-0.5"
      style={{
        backgroundColor: primary ? "#002045" : "#ffffff",
        color: primary ? "#ffffff" : "#002045",
        border: primary ? "none" : "1px solid #c4c6cf",
        boxShadow: "0px 4px 20px rgba(26,54,93,0.08)",
      }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: primary ? "rgba(255,255,255,0.15)" : "rgba(162,237,237,0.2)" }}>
        <span className="material-symbols-outlined text-[32px]"
          style={{ color: primary ? "#ffffff" : "#13696a" }}>{icon}</span>
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-[#43474e]">{label}</label>
      {children}
    </div>
  );
}
