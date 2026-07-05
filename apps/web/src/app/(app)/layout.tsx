"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { onAuthChange, logoutUser } from "@/lib/firebase/auth";
import type { User } from "firebase/auth";

// desktop: todos los ítems; mobile: solo los 5 del bottom bar
const NAV_ITEMS_DESKTOP = [
  { href: "/dashboard",  icon: "home",             label: "Inicio" },
  { href: "/boveda",     icon: "folder_managed",   label: "Bóveda" },
  { href: "/personas",   icon: "group",            label: "Personas" },
  { href: "/asistente",  icon: "auto_awesome",     label: "IA Salud" },
  { href: "/emergencia", icon: "medical_services", label: "Emergencia" },
  { href: "/compartir",  icon: "share",            label: "Compartir" },
  { href: "/ajustes",    icon: "settings",         label: "Ajustes" },
];

const NAV_ITEMS_MOBILE = [
  { href: "/dashboard",  icon: "home",             label: "Inicio" },
  { href: "/boveda",     icon: "folder_managed",   label: "Bóveda" },
  { href: "/asistente",  icon: "auto_awesome",     label: "IA Salud" },
  { href: "/emergencia", icon: "medical_services", label: "Emergencia" },
  { href: "/ajustes",    icon: "settings",         label: "Ajustes" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
      }
      setChecking(false);
    });
    return unsub;
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7fafc" }}>
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[#002045] text-5xl animate-pulse"
            style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          <p className="text-sm text-[#43474e]">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7fafc" }}>
      {/* ── HEADER ── */}
      <header className="fixed top-0 w-full z-50 h-16 flex justify-between items-center px-4 md:px-12"
        style={{ backgroundColor: "rgba(247,250,252,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(196,198,207,0.3)", boxShadow: "0 1px 4px rgba(26,54,93,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#002045] text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          <span className="font-bold text-lg text-[#002045]"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            AppMiSalud Familia
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button className="material-symbols-outlined text-[#43474e] p-2 hover:bg-[#ebeef0] rounded-full transition-colors">
            search
          </button>
          <button
            onClick={async () => { await logoutUser(); router.replace("/login"); }}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#d6e3ff] hover:border-[#002045] transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            {user.photoURL ? (
              <Image src={user.photoURL} alt="Perfil" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: "#002045" }}>
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* ── SIDEBAR DESKTOP ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 z-40 pt-6 pb-8 px-4 gap-1"
        style={{ backgroundColor: "#ffffff", borderRight: "1px solid rgba(196,198,207,0.3)", boxShadow: "2px 0 8px rgba(26,54,93,0.04)" }}>

        {/* Usuario */}
        <div className="mb-6 px-3 py-4 rounded-2xl flex items-center gap-3"
          style={{ backgroundColor: "#f1f4f6" }}>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#d6e3ff] shrink-0">
            {user.photoURL ? (
              <Image src={user.photoURL} alt="Perfil" width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: "#002045" }}>
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#002045] truncate">
              {user.displayName || "Mi cuenta"}
            </p>
            <p className="text-xs text-[#43474e] truncate">{user.email}</p>
          </div>
        </div>

        {/* Nav items */}
        {NAV_ITEMS_DESKTOP.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm"
              style={{
                backgroundColor: active ? "rgba(162,237,237,0.3)" : "transparent",
                color: active ? "#002045" : "#43474e",
              }}>
              <span className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#13696a" }} />}
            </Link>
          );
        })}

        {/* Spacer + cerrar sesión */}
        <div className="mt-auto">
          <button
            onClick={async () => { await logoutUser(); router.replace("/login"); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#43474e] hover:bg-[#ffdad6] hover:text-[#93000a] transition-all">
            <span className="material-symbols-outlined text-[22px]">logout</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="pt-16 md:pl-64 pb-24 md:pb-8 min-h-screen">
        {children}
      </main>

      {/* ── BOTTOM NAV MOBILE ── */}
      <nav className="fixed bottom-0 w-full z-50 md:hidden rounded-t-2xl border-t"
        style={{ backgroundColor: "#ffffff", borderColor: "rgba(196,198,207,0.3)", boxShadow: "0 -4px 20px rgba(26,54,93,0.08)" }}>
        <div className="flex justify-around items-center h-20 px-2">
          {NAV_ITEMS_MOBILE.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-full transition-all active:scale-95"
                style={{
                  backgroundColor: active ? "rgba(162,237,237,0.3)" : "transparent",
                  color: active ? "#002045" : "#74777f",
                }}>
                <span className="material-symbols-outlined text-[24px]"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="text-[11px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
