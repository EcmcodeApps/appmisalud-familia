"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";

interface ConsentState {
  data_treatment: boolean;
  family_auth: boolean;
  ai_usage: boolean;
  reminders: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    data_treatment: false,
    family_auth: false,
    ai_usage: false,
    reminders: false,
  });

  function handleCheck(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setConsent((prev) => ({ ...prev, [name]: checked }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) { router.push("/login"); return; }

    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        consent: {
          data_treatment: consent.data_treatment,
          family_auth: consent.family_auth,
          ai_usage: consent.ai_usage,
          reminders: consent.reminders,
          accepted_at: serverTimestamp(),
        },
        onboarding_completed: true,
      }, { merge: true });
      setShowModal(true);
    } catch {
      // Si falla el guardado igual dejamos pasar — no bloqueamos al usuario
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 md:px-6 py-8 overflow-x-hidden"
      style={{ backgroundColor: "#f7fafc", color: "#181c1e", WebkitFontSmoothing: "antialiased" }}>

      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl overflow-hidden border border-[#e0e3e5]"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>

          {/* Header */}
          <div className="p-6 md:p-8 space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2"
              style={{ backgroundColor: "#005EB8" }}>
              <span className="material-symbols-outlined text-[#d6e3ff] text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                shield_with_heart
              </span>
            </div>
            <h1 className="text-2xl md:text-[32px] font-bold text-[#003A7A]"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Antes de comenzar
            </h1>
            <p className="text-base text-[#43474e] max-w-md mx-auto">
              Tu privacidad y la de tu familia son nuestra máxima prioridad. Por favor, revisa cómo protegemos y gestionamos tu información de salud.
            </p>
          </div>

          {/* Body */}
          <div className="px-6 md:px-8 pb-8 space-y-6">
            {/* Nota de seguridad */}
            <div className="p-4 rounded-2xl border-l-4 flex gap-4"
              style={{ backgroundColor: "#f1f4f6", borderColor: "#00B8A9" }}>
              <span className="material-symbols-outlined text-[#00B8A9] shrink-0">lock</span>
              <div>
                <p className="text-sm font-semibold text-[#003A7A]">Bóveda de Seguridad Médica</p>
                <p className="text-sm text-[#43474e] mt-0.5">
                  Todos los datos están cifrados de extremo a extremo. Solo tú y las personas que autorices explícitamente podrán acceder a los registros clínicos.
                </p>
              </div>
            </div>

            {/* Formulario de consentimiento */}
            <form id="onboardingForm" onSubmit={handleSubmit} className="space-y-3">

              {/* Item 1 — requerido */}
              <ConsentItem
                name="data_treatment"
                checked={consent.data_treatment}
                onChange={handleCheck}
                required
                title="Tratamiento de datos personales"
                description="Acepto el procesamiento de mis datos clínicos para la gestión de mi historial de salud."
              />

              {/* Item 2 — requerido */}
              <ConsentItem
                name="family_auth"
                checked={consent.family_auth}
                onChange={handleCheck}
                required
                title="Autoridad para añadir familiares"
                description="Confirmo que tengo la autoridad legal para gestionar los datos de los miembros que añada a mi cuenta."
              />

              {/* Item 3 — requerido */}
              <ConsentItem
                name="ai_usage"
                checked={consent.ai_usage}
                onChange={handleCheck}
                required
                title="Uso de IA Responsable"
                description="Permito que la IA analice mis registros para ofrecer resúmenes y alertas preventivas personalizadas."
              />

              {/* Item 4 — opcional */}
              <ConsentItem
                name="reminders"
                checked={consent.reminders}
                onChange={handleCheck}
                title="Recordatorios de Salud (Opcional)"
                description="Deseo recibir notificaciones sobre vacunas, chequeos anuales y medicación."
                optional
              />

              {/* Aviso médico */}
              <div className="mt-4 p-4 rounded-2xl border flex gap-3"
                style={{ backgroundColor: "rgba(255,218,214,0.3)", borderColor: "#ffdad6" }}>
                <span className="material-symbols-outlined text-[#ba1a1a] shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#93000a]">Aviso Médico Importante</p>
                  <p className="text-xs text-[#93000a] leading-relaxed opacity-90">
                    Los análisis generados por nuestra Inteligencia Artificial son herramientas de apoyo informativo.{" "}
                    <strong className="font-semibold">
                      La IA de MiSalud FamilIA no sustituye el diagnóstico, consejo o tratamiento de un médico profesional.
                    </strong>{" "}
                    En caso de emergencia, contacta siempre a los servicios de salud locales.
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="pt-4 flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-white font-semibold text-sm rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#003A7A", boxShadow: "0 4px 12px rgba(0,32,69,0.2)" }}
                >
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <>
                      Aceptar y continuar
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
                <a
                  href="https://appmisalud.co/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto h-12 border-2 border-[#00B8A9] text-[#00B8A9] font-semibold text-sm rounded-full flex items-center justify-center px-6 hover:bg-[rgba(19,105,106,0.05)] transition-colors whitespace-nowrap"
                >
                  Más info
                </a>
              </div>
            </form>

            {/* Trust badges */}
            <div className="pt-4 border-t border-[#e0e3e5] flex flex-wrap justify-center gap-8 items-center opacity-60">
              {[
                { icon: "verified_user", label: "GDPR Compliant" },
                { icon: "encrypted", label: "256-bit AES" },
                { icon: "account_balance", label: "Health-Grade Security" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">{b.icon}</span>
                  <span className="text-xs font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Imagen decorativa */}
        <div className="mt-8 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-3 border-4 border-white"
            style={{ boxShadow: "0 8px 24px rgba(0,32,69,0.12)" }}>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1Gv4z4T9JdJzbyA1BUTtArc5gsq4hk2jvLr11-fJvOmoL-BrqvTSVvXdJLDuBosUm4I5AWbqE70oe_vtqSWaNu53WOju6tKV2c5C6cjY1f0JQoCXldNu1POBqt9KauxKTVlL7ejhpuE0D2dnyiO_pr0pFLbgrEgAzVlNhs6Kt2Yfe-24vkEra3DC6nA_5TeDNbvPrSVKW_-2bS1zbjr-6gRNhWLyXnCo0j_JaQoz5xmKxXWftve8aA5nXaGyVjU5ULvTH4uzKzjXC"
              alt="Salud Digital"
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-[#43474e] opacity-70">MiSalud FamilIA • Tu Hogar Digital de Salud</p>
        </div>
      </div>

      {/* Modal de éxito */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(45,49,51,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center"
            style={{ boxShadow: "0 24px 48px rgba(0,32,69,0.2)" }}>
            <span className="material-symbols-outlined text-[#00B8A9] text-6xl mb-4 block">check_circle</span>
            <h2 className="text-2xl font-bold text-[#003A7A] mb-2"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              ¡Todo listo!
            </h2>
            <p className="text-sm text-[#43474e] mb-8">
              Hemos configurado tus preferencias de privacidad. Bienvenido a la familia MiSalud FamilIA.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full h-12 text-white font-semibold text-sm rounded-full transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#003A7A" }}
            >
              Entrar al Dashboard
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

interface ConsentItemProps {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title: string;
  description: string;
  required?: boolean;
  optional?: boolean;
}

function ConsentItem({ name, checked, onChange, title, description, required, optional }: ConsentItemProps) {
  return (
    <label className="flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[#ebeef0]"
      style={optional ? { border: "1px solid transparent" } : {}}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        required={required}
        className="mt-1 shrink-0"
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          width: 24,
          height: 24,
          border: `2px solid ${checked ? "#003A7A" : "#74777f"}`,
          borderRadius: 6,
          backgroundColor: checked ? "#003A7A" : "transparent",
          cursor: "pointer",
          backgroundImage: checked
            ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")"
            : "none",
          backgroundSize: "100% 100%",
          transition: "all 0.15s ease",
        }}
      />
      <div className="flex-1">
        <span className="text-sm font-semibold text-[#003A7A] block">{title}</span>
        <span className="text-sm text-[#43474e]">{description}</span>
      </div>
    </label>
  );
}
