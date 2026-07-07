"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordReset } from "@/lib/firebase/auth";
import { ShieldIcon, ShieldLogo } from "@/components/ShieldLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch {
      // Mensaje genérico: no revelar si el correo existe o no
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-12 overflow-x-hidden"
      style={{ backgroundColor: "#f7fafc", color: "#181c1e" }}>

      {/* Decoración de fondo */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full -z-10"
        style={{ backgroundColor: "rgba(19,105,106,0.05)", filter: "blur(120px)" }} />
      <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full -z-10"
        style={{ backgroundColor: "rgba(0,32,69,0.05)", filter: "blur(100px)" }} />

      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <ShieldIcon size={56} />
          <div className="mt-3"><ShieldLogo size={22} /></div>
          <p className="text-xs font-semibold text-[#43474e] tracking-widest uppercase mt-1">
            Bóveda Médica Segura
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 relative overflow-hidden"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
          {/* Borde superior decorativo */}
          <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
            style={{ backgroundColor: "#00B8A9" }} />

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#003A7A] mb-2 leading-tight"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Recuperar contraseña
            </h2>
            <p className="text-sm text-[#43474e]">
              Escribe tu correo y te enviaremos instrucciones para recuperar el acceso.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold text-[#003A7A] block tracking-wide">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#74777f] text-[20px] transition-colors group-focus-within:text-[#00B8A9]">
                    mail
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-[#c4c6cf] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#00B8A9] focus:border-[#00B8A9] text-sm"
                    style={{ backgroundColor: "#f7fafc" }}
                  />
                </div>
                {error && (
                  <p className="text-xs text-[#93000a] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 group"
                style={{ backgroundColor: "#003A7A", boxShadow: "0 2px 8px rgba(0,32,69,0.2)" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enviar instrucciones</span>
                    <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Estado éxito */
            <div className="space-y-4">
              <div className="p-4 rounded-xl flex items-start gap-3"
                style={{ backgroundColor: "rgba(162,237,237,0.3)", border: "1px solid rgba(19,105,106,0.2)" }}>
                <span className="material-symbols-outlined text-[#00B8A9] shrink-0">check_circle</span>
                <p className="text-xs font-medium text-[#00968A] leading-relaxed">
                  Si el correo existe en nuestra base de datos, recibirás un enlace de recuperación en los próximos minutos. Revisa también tu carpeta de spam.
                </p>
              </div>
              <p className="text-xs text-center text-[#74777f]">
                ¿No llegó el correo?{" "}
                <button onClick={() => setSent(false)}
                  className="text-[#00B8A9] font-semibold hover:underline">
                  Intentar de nuevo
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Links footer */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href="/login"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#00B8A9] hover:underline transition-all">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Volver al inicio de sesión
          </Link>
          <div className="flex items-center gap-2 opacity-60">
            <span className="material-symbols-outlined text-[#43474e] text-[14px]">lock</span>
            <span className="text-xs text-[#43474e]">Conexión cifrada de grado médico</span>
          </div>
        </div>
      </div>

      {/* Badge desktop */}
      <div className="fixed bottom-6 right-6 hidden md:flex items-center gap-2 px-4 py-2 rounded-full border pointer-events-none"
        style={{ backgroundColor: "#f1f4f6", borderColor: "#c4c6cf", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <span className="material-symbols-outlined text-[#00B8A9] text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        <span className="text-xs font-semibold text-[#003A7A]">Privacidad protegida por MiSalud FamilIA</span>
      </div>
    </main>
  );
}
