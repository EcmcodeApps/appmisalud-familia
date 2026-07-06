"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getIdTokenResult, type User } from "firebase/auth";
import { db } from "@/lib/firebase/config";
import { onAuthChange } from "@/lib/firebase/auth";

interface ConsentState {
  data_treatment: boolean;
  family_auth: boolean;
  ai_usage: boolean;
  reminders: boolean;
}

function getDestination(role: unknown) {
  return role === "admin" || role === "owner" ? "/admin" : "/dashboard";
}

async function getTokenRole(user: User) {
  const token = await getIdTokenResult(user, true).catch(() => null);
  const role = token?.claims.role;
  if (role === "owner" || token?.claims.owner === true) return "owner";
  if (role === "admin" || token?.claims.admin === true) return "admin";
  return null;
}

function getCurrentUser() {
  return new Promise<User | null>((resolve) => {
    const unsub = onAuthChange((user) => {
      unsub();
      resolve(user);
    });
  });
}

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [destination, setDestination] = useState("/dashboard");
  const [consent, setConsent] = useState<ConsentState>({
    data_treatment: false,
    family_auth: false,
    ai_usage: false,
    reminders: false,
  });

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const tokenRole = await getTokenRole(user);
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        const nextDestination = getDestination(tokenRole ?? data.role);
        setDestination(nextDestination);

        if (data.onboardingCompleted === true || data.onboarding_completed === true) {
          router.replace(nextDestination);
          return;
        }

        const savedConsent = data.consent ?? {};
        setConsent({
          data_treatment: Boolean(savedConsent.data_treatment ?? savedConsent.medicalDataProcessing),
          family_auth: Boolean(savedConsent.family_auth ?? savedConsent.caregiverResponsibility),
          ai_usage: Boolean(savedConsent.ai_usage ?? savedConsent.aiAnalysis),
          reminders: Boolean(savedConsent.reminders ?? savedConsent.remindersEnabled),
        });
      } catch {
        setError("No pudimos verificar tus autorizaciones. Intenta nuevamente.");
      } finally {
        setChecking(false);
      }
    });

    return unsub;
  }, [router]);

  function handleCheck(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target;
    setConsent((prev) => ({ ...prev, [name]: checked }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = await getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await setDoc(doc(db, "users", user.uid), {
        consent: {
          data_treatment: consent.data_treatment,
          family_auth: consent.family_auth,
          ai_usage: consent.ai_usage,
          reminders: consent.reminders,
          accepted_at: serverTimestamp(),
          medicalDataProcessing: consent.data_treatment,
          caregiverResponsibility: consent.family_auth,
          aiAnalysis: consent.ai_usage,
          remindersEnabled: consent.reminders,
          consentVersion: "1.0",
          acceptedAt: serverTimestamp(),
        },
        settings: {
          remindersEnabled: consent.reminders,
          aiEnabled: consent.ai_usage,
        },
        onboarding_completed: true,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setShowModal(true);
    } catch {
      setError("No pudimos guardar las autorizaciones en Firebase. Revisa tu conexion e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#f7fafc" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="material-symbols-outlined text-[#002045] text-5xl animate-pulse">shield_with_heart</span>
          <p className="text-sm font-semibold text-[#43474e]">Verificando autorizaciones...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 md:px-6 py-8 overflow-x-hidden"
      style={{ backgroundColor: "#f7fafc", color: "#181c1e", WebkitFontSmoothing: "antialiased" }}>
      <div className="w-full max-w-2xl">
        <section
          className="bg-white rounded-3xl overflow-hidden border border-[#e0e3e5]"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          <div className="p-6 md:p-8 space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2" style={{ backgroundColor: "#1a365d" }}>
              <span className="material-symbols-outlined text-[#d6e3ff] text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield_with_heart
              </span>
            </div>
            <h1 className="text-2xl md:text-[32px] font-bold text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Antes de comenzar
            </h1>
            <p className="text-base text-[#43474e] max-w-md mx-auto">
              Tu privacidad y la de tu familia son nuestra maxima prioridad. Revisa y acepta las autorizaciones para gestionar informacion de salud.
            </p>
          </div>

          <div className="px-6 md:px-8 pb-8 space-y-6">
            <div className="p-4 rounded-2xl border-l-4 flex gap-4" style={{ backgroundColor: "#f1f4f6", borderColor: "#13696a" }}>
              <span className="material-symbols-outlined text-[#13696a] shrink-0">lock</span>
              <div>
                <p className="text-sm font-semibold text-[#002045]">Boveda de seguridad medica</p>
                <p className="text-sm text-[#43474e] mt-0.5">
                  Tus autorizaciones se guardan en Firebase y no se volveran a pedir en los siguientes ingresos.
                </p>
              </div>
            </div>

            <form id="onboardingForm" onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-3 rounded-xl flex items-center gap-2 text-sm" style={{ backgroundColor: "#ffdad6", color: "#93000a" }}>
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              <ConsentItem
                name="data_treatment"
                checked={consent.data_treatment}
                onChange={handleCheck}
                required
                title="Tratamiento de datos personales"
                description="Acepto el procesamiento de mis datos clinicos para la gestion de mi historial de salud."
              />
              <ConsentItem
                name="family_auth"
                checked={consent.family_auth}
                onChange={handleCheck}
                required
                title="Autoridad para anadir familiares"
                description="Confirmo que tengo la autoridad legal para gestionar los datos de los miembros que anada a mi cuenta."
              />
              <ConsentItem
                name="ai_usage"
                checked={consent.ai_usage}
                onChange={handleCheck}
                required
                title="Uso de IA responsable"
                description="Permito que la IA analice mis registros para ofrecer resumenes y alertas preventivas personalizadas."
              />
              <ConsentItem
                name="reminders"
                checked={consent.reminders}
                onChange={handleCheck}
                title="Recordatorios de salud (opcional)"
                description="Deseo recibir notificaciones sobre vacunas, chequeos anuales y medicacion."
                optional
              />

              <div className="mt-4 p-4 rounded-2xl border flex gap-3" style={{ backgroundColor: "rgba(255,218,214,0.3)", borderColor: "#ffdad6" }}>
                <span className="material-symbols-outlined text-[#ba1a1a] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#93000a]">Aviso medico importante</p>
                  <p className="text-xs text-[#93000a] leading-relaxed opacity-90">
                    Los analisis generados por IA son herramientas de apoyo informativo. La IA de AppMiSalud no sustituye el diagnostico, consejo o tratamiento de un medico profesional.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col md:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-white font-semibold text-sm rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#002045", boxShadow: "0 4px 12px rgba(0,32,69,0.2)" }}>
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  ) : (
                    <>
                      Aceptar y continuar
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
                <Link
                  href="https://appmisalud.co/privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto h-12 border-2 border-[#13696a] text-[#13696a] font-semibold text-sm rounded-full flex items-center justify-center px-6 hover:bg-[rgba(19,105,106,0.05)] transition-colors whitespace-nowrap">
                  Mas info
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(45,49,51,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center" style={{ boxShadow: "0 24px 48px rgba(0,32,69,0.2)" }}>
            <span className="material-symbols-outlined text-[#13696a] text-6xl mb-4 block">check_circle</span>
            <h2 className="text-2xl font-bold text-[#002045] mb-2" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Todo listo
            </h2>
            <p className="text-sm text-[#43474e] mb-8">
              Guardamos tus autorizaciones. No volveremos a pedirlas mientras sigan registradas en tu perfil.
            </p>
            <button
              onClick={() => router.push(destination)}
              className="w-full h-12 text-white font-semibold text-sm rounded-full transition-all active:scale-[0.98]"
              style={{ backgroundColor: "#002045" }}>
              Entrar
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
    <label className="flex items-start gap-4 p-3 rounded-xl cursor-pointer transition-colors hover:bg-[#ebeef0]" style={optional ? { border: "1px solid transparent" } : {}}>
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
          border: `2px solid ${checked ? "#002045" : "#74777f"}`,
          borderRadius: 6,
          backgroundColor: checked ? "#002045" : "transparent",
          cursor: "pointer",
          backgroundImage: checked
            ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E\")"
            : "none",
          backgroundSize: "100% 100%",
          transition: "all 0.15s ease",
        }}
      />
      <div className="flex-1">
        <span className="text-sm font-semibold text-[#002045] block">{title}</span>
        <span className="text-sm text-[#43474e]">{description}</span>
      </div>
    </label>
  );
}
