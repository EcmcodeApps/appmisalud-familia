"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginUser, loginWithGoogle } from "@/lib/firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(form.email, form.password);
      router.push("/dashboard");
    } catch {
      setError("Correo o contraseña incorrectos. Verifica tus datos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative px-4 md:px-0 selection:bg-[#a2eded]"
      style={{ backgroundColor: "#f7fafc" }}>

      {/* Fondo gradiente */}
      <div className="absolute inset-0 -z-10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f7fafc 0%, #f1f4f6 100%)" }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(165,239,240,0.2)" }} />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(173,199,247,0.1)" }} />
      </div>

      {/* Imagen de fondo */}
      <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden opacity-40">
        <Image
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuATSo3ifUspr7drdS_lJ-shlhWaEDNbzYrf93oOEthBRdcBfe8MgwpzSxLHBCJ3KsjamlhSRcTGZZUIGBruPIjFWrwzGel55tJl9022ZTIR0cSANqzkJq5smyAYCImi5z5x2AFV1uv24_oeW-BmAin5kK2dSwca3nvnXHt55uBIrkF-JgOY0s0-4QM3PjV5eEQK1NXcTItrhdXLEHq8zSTlsRwbqzHno_DtyrDFcG2jA8xr5cO8CI1Ed97xhP_AMX03fLRwqV10f0vg"
          alt=""
          fill
          className="object-cover"
          priority={false}
        />
      </div>

      <div className="w-full max-w-[440px] flex flex-col space-y-6">

        {/* Branding */}
        <header className="text-center flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
            style={{ backgroundColor: "#1a365d", boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
            <span className="material-symbols-outlined text-[#d6e3ff] text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
          </div>
          <h1 className="text-[#002045] text-2xl md:text-[32px] font-bold tracking-tight"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            AppMiSalud Familia
          </h1>
          <p className="text-[#43474e] text-base px-4">
            Bienvenido a su bóveda de salud familiar segura.
          </p>
        </header>

        {/* Card formulario */}
        <section className="bg-white rounded-xl p-6 space-y-6 border"
          style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)", borderColor: "rgba(196,198,207,0.3)" }}>

          {error && (
            <div className="p-3 rounded-xl flex items-center gap-2 text-sm"
              style={{ backgroundColor: "#ffdad6", color: "#93000a" }}>
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-[#43474e] block tracking-wide">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#74777f] text-[20px]">mail</span>
                <input
                  id="email" name="email" type="email"
                  placeholder="ejemplo@correo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#f7fafc] border border-[#c4c6cf] rounded-lg outline-none transition-all focus:ring-1 focus:ring-[#13696a] focus:border-[#13696a] text-sm"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-semibold text-[#43474e] block tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#74777f] text-[20px]">lock</span>
                <input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-11 py-3 bg-[#f7fafc] border border-[#c4c6cf] rounded-lg outline-none transition-all focus:ring-1 focus:ring-[#13696a] focus:border-[#13696a] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#002045] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Olvidé contraseña */}
            <div className="text-right">
              <Link href="/forgot-password"
                className="text-sm font-semibold text-[#13696a] hover:underline transition-all">
                Olvidé mi contraseña
              </Link>
            </div>

            {/* Botón ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
              style={{ backgroundColor: "#002045", boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span>Ingresar</span>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 py-1">
            <hr className="flex-grow border-[rgba(196,198,207,0.3)]" />
            <span className="text-xs text-[#c4c6cf]">O</span>
            <hr className="flex-grow border-[rgba(196,198,207,0.3)]" />
          </div>

          {/* Crear cuenta */}
          <Link href="/register"
            className="w-full h-12 rounded-full border-2 border-[#13696a] text-[#13696a] font-semibold text-sm flex items-center justify-center hover:bg-[rgba(19,105,106,0.05)] active:scale-[0.98] transition-all">
            Crear cuenta
          </Link>
        </section>

        {/* Footer de seguridad */}
        <footer className="space-y-4">
          <div className="rounded-lg p-4 flex items-start gap-4"
            style={{ backgroundColor: "rgba(162,237,237,0.3)" }}>
            <span className="material-symbols-outlined text-[#13696a] shrink-0 mt-0.5">security_update_good</span>
            <p className="text-xs font-medium text-[#1a6d6e]">
              Tu información médica requiere acceso seguro. Nunca compartas tu contraseña.
            </p>
          </div>
          <div className="flex items-center justify-center gap-1 opacity-60">
            <span className="material-symbols-outlined text-[#74777f] text-[16px]">auto_awesome</span>
            <span className="text-xs text-[#74777f]">Protección de Datos con IA Responsable</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
