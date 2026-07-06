"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db, auth } from "@/lib/firebase/config";
import { logoutUser } from "@/lib/firebase/auth";
import { useTrialStatus } from "@/lib/hooks/useTrialStatus";
import { TrialStatusCard } from "@/components/TrialStatusCard";

type AIProvider = "recommended" | "deepseek" | "openai";

interface Prefs {
  aiProvider: AIProvider;
  notifCitas: boolean;
  notifVacunas: boolean;
  notifRecetas: boolean;
}

const DEFAULT_PREFS: Prefs = {
  aiProvider: "recommended",
  notifCitas: true,
  notifVacunas: true,
  notifRecetas: false,
};

export default function AjustesPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { trial } = useTrialStatus();

  // Load prefs from Firestore
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists() && snap.data().preferences) {
        setPrefs({ ...DEFAULT_PREFS, ...snap.data().preferences });
      }
    });
  }, [user]);

  async function savePrefs(updated: Prefs) {
    const uid = user?.uid;
    if (!uid) return;
    setSaving(true);
    await setDoc(doc(db, "users", uid), { preferences: updated }, { merge: true });
    setSaving(false);
  }

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    savePrefs(updated);
    showToast(`Preferencia guardada: ${typeof value === "boolean" ? (value ? "Activado" : "Desactivado") : value}`);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleDeleteAccount() {
    if (!confirm("¿Eliminar tu cuenta y todos los datos médicos? Esta acción es IRREVERSIBLE.")) return;
    if (!confirm("Segunda confirmación: ¿Estás completamente seguro? Se borrarán todos los registros de tu familia.")) return;
    setDeletingAccount(true);
    try {
      if (user) await deleteUser(user);
      router.replace("/login");
    } catch {
      alert("Para eliminar la cuenta debes haber iniciado sesión recientemente. Cierra sesión, vuelve a entrar y repite la acción.");
      setDeletingAccount(false);
    }
  }

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  const avatar = user?.photoURL;
  const name = user?.displayName || "Mi cuenta";
  const email = user?.email || "";

  return (
    <div className="px-4 md:px-12 max-w-2xl mx-auto py-6 pb-10 space-y-4">

      {/* Profile card */}
      <section className="bg-white rounded-xl p-4 flex items-center gap-4 border border-[rgba(196,198,207,0.3)]"
        style={{ boxShadow: "0px 4px 12px rgba(26,54,93,0.06)" }}>
        <div className="relative shrink-0">
          {avatar ? (
            <Image src={avatar} alt={name} width={64} height={64}
              className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: "#002045" }}>
              {name[0].toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
            style={{ backgroundColor: "#002045" }}>
            <span className="material-symbols-outlined text-white" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#002045] truncate">{name}</p>
          <p className="text-xs text-[#43474e] truncate">{email}</p>
          <p className="text-xs text-[#13696a] font-semibold">
            {trial?.status === "active" ? "Gestora Familiar · Activa" : "Gestora Familiar · Prueba gratuita"}
          </p>
        </div>
        <Link href="/ajustes/perfil"
          className="p-2 rounded-full hover:bg-[#f1f4f6] transition-colors shrink-0">
          <span className="material-symbols-outlined text-[#002045]">edit</span>
        </Link>
      </section>

      {trial && <TrialStatusCard trial={trial} compact />}

      {/* Cuenta y Seguridad */}
      <SettingsGroup label="Cuenta y Seguridad">
        <SettingsRow icon="person" label="Mi cuenta" sublabel="Información personal y contacto" href="/ajustes/cuenta" />
        <SettingsRow icon="lock" label="Seguridad" sublabel="Contraseña, 2FA y Biometría" href="/ajustes/seguridad" />
        <SettingsRow icon="privacy_tip" label="Privacidad" sublabel="Control de visibilidad de datos" href="/ajustes/privacidad" />
      </SettingsGroup>

      {/* IA Salud */}
      <div className="bg-[#f1f4f6] rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#13696a]">auto_awesome</span>
          <h3 className="font-semibold text-[#002045] text-sm">IA Salud &amp; Proveedor</h3>
          <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(162,237,237,0.5)" }}>
            <span className="material-symbols-outlined text-[#1a6d6e]" style={{ fontSize: 12 }}>neurology</span>
            <span className="text-[10px] font-bold text-[#1a6d6e] uppercase">IA Activa</span>
          </div>
        </div>
        <p className="text-xs text-[#43474e]">
          Selecciona el motor de inteligencia artificial que procesará tus consultas médicas familiares.
        </p>

        {/* Recommended */}
        <label className="flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all"
          style={{
            backgroundColor: prefs.aiProvider === "recommended" ? "#e5e9eb" : "#ffffff",
            borderColor: prefs.aiProvider === "recommended" ? "#13696a" : "#c4c6cf",
          }}>
          <input type="radio" name="ai" className="hidden"
            checked={prefs.aiProvider === "recommended"}
            onChange={() => updatePref("aiProvider", "recommended")} />
          <div className="flex-1">
            <span className="block font-bold text-[#002045] text-sm">Recomendado (Híbrido)</span>
            <span className="text-xs text-[#43474e]">Optimizado para precisión médica familiar</span>
          </div>
          {prefs.aiProvider === "recommended" && (
            <span className="material-symbols-outlined text-[#13696a]"
              style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          )}
        </label>

        {/* Other providers */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {([
            { val: "deepseek" as AIProvider, icon: "memory",     label: "DeepSeek" },
            { val: "openai"  as AIProvider, icon: "psychology",  label: "OpenAI GPT-4" },
          ]).map((p) => (
            <label key={p.val}
              className="flex-shrink-0 flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:bg-[#e5e9eb] transition-colors"
              style={{
                backgroundColor: prefs.aiProvider === p.val ? "#e5e9eb" : "#ffffff",
                borderColor: prefs.aiProvider === p.val ? "#13696a" : "#c4c6cf",
              }}>
              <input type="radio" name="ai" className="hidden"
                checked={prefs.aiProvider === p.val}
                onChange={() => updatePref("aiProvider", p.val)} />
              <span className="material-symbols-outlined text-[#43474e] text-[20px]">{p.icon}</span>
              <span className="text-xs font-semibold text-[#002045]">{p.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notificaciones */}
      <SettingsGroup label="Notificaciones">
        <ToggleRow
          icon="event_available" label="Citas Médicas"
          checked={prefs.notifCitas}
          onChange={(v) => updatePref("notifCitas", v)} />
        <ToggleRow
          icon="vaccines" label="Vacunación"
          checked={prefs.notifVacunas}
          onChange={(v) => updatePref("notifVacunas", v)} />
        <ToggleRow
          icon="refresh" label="Renovación de Recetas"
          checked={prefs.notifRecetas}
          onChange={(v) => updatePref("notifRecetas", v)} />
      </SettingsGroup>

      {/* Familia y datos */}
      <SettingsGroup label="">
        <SettingsRow icon="family_restroom" label="Personas y permisos" sublabel="Gestionar cargas familiares" href="/personas" />
        <SettingsRow icon="download" label="Descargar mis datos" sublabel="Historial clínico completo (PDF/JSON)"
          onClick={() => alert("Exportación de datos disponible próximamente.")} />
      </SettingsGroup>

      {/* Cerrar sesión */}
      <button onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] hover:opacity-90"
        style={{ backgroundColor: "#f1f4f6", color: "#43474e" }}>
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Cerrar sesión
      </button>

      {/* Danger zone */}
      <div className="pt-2">
        <button onClick={handleDeleteAccount} disabled={deletingAccount}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#ffdad6", color: "#93000a" }}>
          {deletingAccount
            ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            : <span className="material-symbols-outlined text-[20px]">delete_forever</span>}
          Eliminar cuenta y datos
        </button>
        <p className="text-[11px] text-center mt-2 text-[#43474e] px-6">
          Esta acción es irreversible y eliminará todos los registros médicos vinculados a tu familia.
        </p>
      </div>

      {/* Trust badge */}
      <div className="flex flex-col items-center gap-1 opacity-60 py-4">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[#002045] text-[16px]">enhanced_encryption</span>
          <span className="text-xs font-bold text-[#002045]">Cifrado de Extremo a Extremo</span>
        </div>
        <p className="text-[10px] text-[#43474e]">AppMiSalud Familia v1.0.0 · 2025</p>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: "#13696a" }}>
          <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
          Guardando…
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold text-white animate-bounce"
          style={{ backgroundColor: "#002045", transform: "translateX(-50%)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function SettingsGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#f1f4f6] rounded-xl overflow-hidden">
      {label && (
        <div className="px-4 py-2 border-b border-[rgba(196,198,207,0.3)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#43474e] opacity-70">{label}</span>
        </div>
      )}
      {children}
    </div>
  );
}

function SettingsRow({ icon, label, sublabel, href, onClick }: {
  icon: string; label: string; sublabel?: string;
  href?: string; onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="material-symbols-outlined text-[#002045] shrink-0">{icon}</span>
      <div className="flex-1 text-left min-w-0">
        <span className="block text-sm text-[#181c1e]">{label}</span>
        {sublabel && <span className="text-xs text-[#43474e]">{sublabel}</span>}
      </div>
      <span className="material-symbols-outlined text-[#74777f] shrink-0">chevron_right</span>
    </>
  );

  const cls = "w-full flex items-center gap-4 p-4 hover:bg-[#e5e9eb] transition-all active:scale-[0.99]";

  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <button onClick={onClick} className={cls}>{inner}</button>
  );
}

function ToggleRow({ icon, label, checked, onChange }: {
  icon: string; label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-[#e5e9eb] transition-colors">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-[#002045]">{icon}</span>
        <span className="text-sm text-[#181c1e]">{label}</span>
      </div>
      <button
        role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
        style={{ backgroundColor: checked ? "#13696a" : "#c4c6cf" }}>
        <span className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }} />
      </button>
    </div>
  );
}
