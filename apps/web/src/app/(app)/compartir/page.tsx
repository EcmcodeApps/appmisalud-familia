"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  serverTimestamp, query, orderBy, Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";

type ShareType = "documentos" | "carpeta" | "resumen_ia";
type Duration  = "ilimitado" | "24h" | "7d";

interface Share {
  id: string;
  recipientEmail: string;
  recipientName?: string;
  shareType: ShareType;
  canDownload: boolean;
  duration: Duration;
  expiresAt: Timestamp | null;
  createdAt: Timestamp | null;
}

function expiryLabel(s: Share): string {
  if (!s.expiresAt) return "Acceso permanente";
  const ms = s.expiresAt.toMillis() - Date.now();
  if (ms <= 0) return "Expirado";
  const h = Math.round(ms / 3_600_000);
  if (h < 24) return `Expira en ${h}h`;
  return `Expira en ${Math.round(h / 24)}d`;
}

function shareTypeLabel(t: ShareType) {
  return { documentos: "Documentos específicos", carpeta: "Carpeta familiar", resumen_ia: "Resumen IA Salud" }[t];
}
function shareTypeIcon(t: ShareType) {
  return { documentos: "description", carpeta: "folder_shared", resumen_ia: "auto_awesome" }[t];
}

export default function CompartirPage() {
  const router = useRouter();

  const [shares,        setShares]        = useState<Share[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [revoking,      setRevoking]      = useState<string | null>(null);
  const [toast,         setToast]         = useState("");

  // Form state
  const [recipient,     setRecipient]     = useState("");
  const [shareType,     setShareType]     = useState<ShareType>("resumen_ia");
  const [canDownload,   setCanDownload]   = useState(false);
  const [duration,      setDuration]      = useState<Duration>("ilimitado");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  // Load existing shares
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { router.replace("/login"); return; }

    getDocs(query(collection(db, "users", uid, "shares"), orderBy("createdAt", "desc")))
      .then((snap) => {
        setShares(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Share[]);
        setLoading(false);
      });
  }, [router]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim()) { showToast("Ingresa un correo o nombre."); return; }
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSending(true);

    let expiresAt: Date | null = null;
    if (duration === "24h") { expiresAt = new Date(Date.now() + 86_400_000); }
    if (duration === "7d")  { expiresAt = new Date(Date.now() + 7 * 86_400_000); }

    const data = {
      recipientEmail: recipient.trim(),
      shareType,
      canDownload,
      duration,
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, "users", uid, "shares"), data);
    const newShare: Share = { id: ref.id, ...data, createdAt: null };
    setShares((prev) => [newShare, ...prev]);
    setRecipient("");
    setSending(false);
    showToast("Invitación enviada correctamente.");
  }

  async function handleRevoke(shareId: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setRevoking(shareId);
    await deleteDoc(doc(db, "users", uid, "shares", shareId));
    setShares((prev) => prev.filter((s) => s.id !== shareId));
    setRevoking(null);
    showToast("Acceso revocado.");
  }

  const QUICK_CONTACTS = [
    { label: "Dr. Rodríguez", email: "dr.rodriguez@clinica.com" },
    { label: "Esposo/a",      email: "" },
  ];

  return (
    <>
      {/* Sub-header */}
      <div className="sticky top-16 z-40 flex items-center justify-between px-4 md:px-12 h-14"
        style={{ backgroundColor: "rgba(247,250,252,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(196,198,207,0.3)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#ebeef0] transition-colors">
            <span className="material-symbols-outlined text-[#002045]">arrow_back</span>
          </button>
          <h1 className="font-bold text-base text-[#002045]"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            Compartir Bóveda Médica
          </h1>
        </div>
        <span className="material-symbols-outlined text-[#13696a]"
          style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
      </div>

      <main className="px-4 md:px-12 max-w-2xl mx-auto py-6 space-y-5">

        {/* Security notice */}
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-[#13696a]/20"
          style={{ backgroundColor: "rgba(162,237,237,0.15)" }}>
          <span className="material-symbols-outlined text-[#13696a] shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}>lock_person</span>
          <div>
            <p className="text-sm font-semibold text-[#13696a] mb-0.5">Aviso de Seguridad</p>
            <p className="text-xs text-[#43474e]">
              Comparte información médica solo con personas de confianza. Los permisos pueden ser revocados en cualquier momento.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="space-y-4">

          {/* Recipient */}
          <Card title="Destinatario">
            <div className="flex items-center gap-2 border border-[#c4c6cf] rounded-xl bg-[#f7fafc] px-3 py-2 focus-within:ring-2 focus-within:ring-[#13696a]/30 transition-all">
              <span className="material-symbols-outlined text-[#74777f]">person_search</span>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Correo electrónico o nombre del contacto"
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#002045] placeholder:text-[#74777f]"
                type="text"
              />
            </div>
            {/* Quick contacts */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {QUICK_CONTACTS.map((c) => (
                <button key={c.label} type="button"
                  onClick={() => setRecipient(c.email || c.label)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{ backgroundColor: "#ebeef0", color: "#002045" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "#13696a" }}>
                    {c.label[0]}
                  </div>
                  {c.label}
                </button>
              ))}
            </div>
          </Card>

          {/* What to share */}
          <Card title="¿Qué deseas compartir?">
            <div className="space-y-2">
              {(["documentos", "carpeta", "resumen_ia"] as ShareType[]).map((t) => {
                const active = shareType === t;
                return (
                  <label key={t}
                    className="flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all"
                    style={{
                      borderColor: active ? "#13696a" : "rgba(196,198,207,0.4)",
                      backgroundColor: active ? "rgba(162,237,237,0.1)" : "white",
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#13696a]"
                        style={{ fontVariationSettings: t === "resumen_ia" ? "'FILL' 1" : "'FILL' 0" }}>
                        {shareTypeIcon(t)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#002045]">{shareTypeLabel(t)}</p>
                        <p className="text-xs text-[#74777f]">
                          {t === "documentos" && "Selecciona archivos individuales"}
                          {t === "carpeta"    && "Acceso a toda la subcarpeta de un miembro"}
                          {t === "resumen_ia" && "Resumen inteligente generado por IA"}
                        </p>
                      </div>
                    </div>
                    <input type="radio" name="share_type" checked={active}
                      onChange={() => setShareType(t)}
                      className="w-4 h-4 accent-[#13696a]" />
                  </label>
                );
              })}
            </div>
          </Card>

          {/* Permissions + Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Card title="Nivel de Permisos">
              <div className="space-y-3">
                <ToggleRow
                  label="Solo ver"
                  checked={true}
                  onChange={() => {}}
                  disabled
                />
                <ToggleRow
                  label="Ver y descargar"
                  checked={canDownload}
                  onChange={() => setCanDownload((v) => !v)}
                />
              </div>
            </Card>

            <Card title="Acceso Temporal">
              <div className="flex flex-wrap gap-2">
                {(["ilimitado", "24h", "7d"] as Duration[]).map((d) => (
                  <button key={d} type="button"
                    onClick={() => setDuration(d)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                    style={{
                      backgroundColor: duration === d ? "rgba(162,237,237,0.5)" : "#f1f4f6",
                      borderColor:     duration === d ? "#13696a" : "rgba(196,198,207,0.4)",
                      color:           duration === d ? "#1a6d6e" : "#43474e",
                    }}>
                    {d === "ilimitado" ? "Ilimitado" : d}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-wider font-bold text-[#74777f]">
                {duration === "24h" ? "Recomendado para consultas rápidas"
                  : duration === "7d" ? "Recomendado para tratamientos"
                  : "Acceso permanente hasta revocar"}
              </p>
            </Card>
          </div>

          {/* Send button */}
          <button type="submit" disabled={sending || !recipient.trim()}
            className="w-full h-14 rounded-xl text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            style={{ backgroundColor: "#002045", boxShadow: "0 4px 20px rgba(0,32,69,0.2)" }}>
            {sending
              ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined">send</span>}
            {sending ? "Enviando…" : "Enviar invitación de acceso"}
          </button>
          <p className="text-center text-xs text-[#74777f] px-6">
            Se guardará el acceso en tu bóveda. El destinatario recibirá una notificación.
          </p>
        </form>

        {/* Active shares */}
        {!loading && (
          <Card title={`Accesos Activos (${shares.length})`}>
            {shares.length === 0 ? (
              <p className="text-sm text-[#74777f] italic text-center py-4">
                No hay accesos activos todavía.
              </p>
            ) : (
              <div className="divide-y divide-[#ebeef0]">
                {shares.map((s) => (
                  <div key={s.id}
                    className="flex items-center justify-between py-4 transition-all"
                    style={{ opacity: revoking === s.id ? 0.4 : 1 }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#c3e8fd" }}>
                        <span className="material-symbols-outlined text-[#002432]">
                          {shareTypeIcon(s.shareType)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#002045] truncate">
                          {s.recipientEmail}
                        </p>
                        <p className="text-xs text-[#74777f]">
                          {shareTypeLabel(s.shareType)} · {expiryLabel(s)}
                          {s.canDownload && " · Puede descargar"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(s.id)}
                      disabled={revoking === s.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/50 transition-colors shrink-0 disabled:opacity-40">
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      Revocar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-full text-sm font-semibold text-white shadow-lg"
          style={{ backgroundColor: "#002045" }}>
          {toast}
        </div>
      )}
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[rgba(196,198,207,0.3)]"
      style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
      <h3 className="text-sm font-bold text-[#002045] mb-4"
        style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange, disabled }: {
  label: string; checked: boolean; onChange: () => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-[#43474e]">{label}</span>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className="relative w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-60"
        style={{ backgroundColor: checked ? "#13696a" : "#c4c6cf" }}>
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
          style={{ left: checked ? "calc(100% - 1.375rem)" : "0.125rem" }}
        />
      </button>
    </div>
  );
}
