"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser, loginWithGoogle } from "@/lib/firebase/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.terms) { setError("Debes aceptar los términos para continuar."); return; }
    if (form.password !== form.confirmPassword) { setError("Las contraseñas no coinciden."); return; }
    if (form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }

    setLoading(true);
    try {
      await registerUser(form.email, form.password, form.fullName);
      router.push("/onboarding");
    } catch {
      setError("No pudimos crear tu cuenta. Verifica que el correo no esté registrado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    try {
      const { onboardingCompleted } = await loginWithGoogle();
      router.push(onboardingCompleted ? "/dashboard" : "/onboarding");
    } catch {
      setError("No pudimos conectar con Google. Intenta de nuevo.");
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="font-[Inter] text-[#181c1e] antialiased" style={{ backgroundColor: "#f7fafc", minHeight: "max(884px, 100dvh)" }}>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 h-16 flex items-center justify-center px-4"
        style={{ backgroundColor: "rgba(247,250,252,0.8)", backdropFilter: "blur(12px)" }}>
        <Link href="/" className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#002045] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield_with_heart
          </span>
          <h1 className="font-bold text-xl text-[#002045]" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            AppMiSalud Familia
          </h1>
        </Link>
      </header>

      <main className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: "rgba(162,237,237,0.3)" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: "rgba(26,54,93,0.1)" }} />

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl p-6 relative z-10"
          style={{ boxShadow: "0px 4px 20px rgba(26, 54, 93, 0.08)" }}>

          <div className="mb-6">
            <h2 className="font-bold text-2xl text-[#002045] mb-1" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              Crear cuenta
            </h2>
            <p className="text-[#43474e] text-sm">Únete a la bóveda de salud de tu familia.</p>
          </div>

          {/* Botón Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full h-12 flex items-center justify-center gap-3 border border-[#c4c6cf] rounded-xl bg-white hover:bg-[#f1f4f6] transition-all mb-4 font-semibold text-sm text-[#181c1e] disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="material-symbols-outlined animate-spin text-[#002045]">progress_activity</span>
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? "Conectando..." : "Continuar con Google"}
          </button>

          {/* Separador */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#c4c6cf]" />
            <span className="text-xs text-[#74777f]">o regístrate con correo</span>
            <div className="flex-1 h-px bg-[#c4c6cf]" />
          </div>

          {/* Error global */}
          {error && (
            <div className="mb-4 p-3 bg-[#ffdad6] rounded-xl flex items-center gap-2 text-sm text-[#93000a]">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <Field label="Nombre completo" icon="person">
              <input
                id="fullName" name="fullName" type="text"
                placeholder="Ej. María González"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#c4c6cf] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#13696a] focus:border-[#13696a] text-sm"
              />
            </Field>

            {/* Email */}
            <Field label="Correo electrónico" icon="mail">
              <input
                id="email" name="email" type="email"
                placeholder="nombre@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#c4c6cf] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#13696a] focus:border-[#13696a] text-sm"
              />
            </Field>

            {/* Contraseña */}
            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-xs font-semibold text-[#002045] tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#c4c6cf] text-[20px]">lock</span>
                <input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-white border border-[#c4c6cf] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#13696a] focus:border-[#13696a] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c4c6cf] hover:text-[#002045] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <Field label="Confirmar contraseña" icon="lock_reset">
              <input
                id="confirmPassword" name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-white border border-[#c4c6cf] rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#13696a] focus:border-[#13696a] text-sm"
              />
            </Field>

            {/* Aviso seguridad */}
            <div className="bg-[#f1f4f6] p-3 rounded-xl flex gap-3 items-start">
              <span className="material-symbols-outlined text-[#13696a] mt-0.5 text-[18px]">security</span>
              <p className="text-xs text-[#43474e]">
                Usa una contraseña segura. Tu cuenta protegerá información médica sensible.
              </p>
            </div>

            {/* Términos */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="terms" name="terms" type="checkbox"
                checked={form.terms}
                onChange={handleChange}
                className="mt-0.5 h-5 w-5 rounded border-[#c4c6cf] text-[#13696a] cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-[#43474e] cursor-pointer">
                Acepto los{" "}
                <a href="#" className="text-[#13696a] font-semibold hover:underline">Términos de Servicio</a>
                {" "}y la{" "}
                <a href="#" className="text-[#13696a] font-semibold hover:underline">Política de Privacidad</a>.
              </label>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-12 bg-[#002045] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-[#1a365d] active:scale-[0.98] transition-all disabled:opacity-60"
              style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Crear cuenta
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Link a login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-[#43474e]">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="text-[#13696a] font-bold hover:underline ml-1">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 max-w-md w-full">
          {[
            { icon: "verified_user", label: "Cifrado HIPAA" },
            { icon: "lock", label: "Privacidad Garantizada" },
            { icon: "family_restroom", label: "Entorno Familiar" },
          ].map((b) => (
            <div key={b.label}
              className="flex items-center gap-1 px-4 py-2 rounded-full border text-xs font-semibold text-[#002045]"
              style={{ backgroundColor: "rgba(162,237,237,0.2)", borderColor: "rgba(19,105,106,0.1)" }}>
              <span className="material-symbols-outlined text-[#13696a] text-[14px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>

        {/* Nota IA */}
        <div className="mt-4 flex items-center gap-2 opacity-60">
          <span className="material-symbols-outlined text-[#13696a] text-[14px]">auto_awesome</span>
          <p className="text-xs text-[#43474e]">IA Responsable para el cuidado preventivo</p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  const id = label.toLowerCase().replace(/ /g, "_");
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold text-[#002045] tracking-wide">{label}</label>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#c4c6cf] text-[20px]">{icon}</span>
        {children}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
