import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seguridad de la informacion medica | AppMiSalud Familia",
  description:
    "Como AppMiSalud Familia protege datos personales sensibles de salud bajo principios de la normatividad colombiana.",
};

const legalFramework = [
  {
    law: "Ley 1581 de 2012",
    title: "Regimen general de proteccion de datos personales",
    summary:
      "Reconoce derechos de los titulares y fija principios para recolectar, almacenar, usar y proteger datos personales.",
    href: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981",
  },
  {
    law: "Decreto 1377 de 2013",
    title: "Reglamentacion parcial de la Ley 1581",
    summary:
      "Desarrolla reglas sobre autorizacion, politicas de tratamiento, finalidad, aviso de privacidad y derechos del titular.",
    href: "https://www.suin-juriscol.gov.co/viewDocument.asp?id=1276081",
  },
  {
    law: "Ley 2015 de 2020",
    title: "Historia Clinica Electronica Interoperable",
    summary:
      "Regula la interoperabilidad de la historia clinica electronica y refuerza la importancia de disponibilidad, integridad y reserva.",
    href: "https://www.secretariasenado.gov.co/senado/basedoc/ley_2015_2020.html",
  },
  {
    law: "Ley 23 de 1981",
    title: "Etica medica e historia clinica",
    summary:
      "Define la historia clinica como registro obligatorio de condiciones de salud y protege el secreto profesional medico.",
    href: "https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=154130",
  },
];

const principles = [
  {
    icon: "verified_user",
    title: "Autorizacion previa e informada",
    text: "Antes de usar datos clinicos, la app solicita autorizaciones explicitas sobre tratamiento de datos, familiares a cargo y uso de IA.",
  },
  {
    icon: "lock",
    title: "Finalidad limitada",
    text: "La informacion se usa para organizar documentos, generar resumenes, facilitar consultas familiares y apoyar la preparacion ante emergencias.",
  },
  {
    icon: "visibility_off",
    title: "Reserva y acceso controlado",
    text: "Cada usuario accede a su propia boveda. Compartir documentos debe ser una accion voluntaria y trazable.",
  },
  {
    icon: "fact_check",
    title: "Calidad y actualizacion",
    text: "El usuario puede revisar, corregir, actualizar o eliminar informacion almacenada en su perfil familiar.",
  },
  {
    icon: "shield_lock",
    title: "Seguridad tecnica",
    text: "La arquitectura usa autenticacion, reglas de acceso, almacenamiento protegido y controles para reducir exposicion indebida.",
  },
  {
    icon: "psychology",
    title: "IA responsable",
    text: "La IA organiza y explica informacion, pero no reemplaza diagnostico, tratamiento ni criterio de un profesional de salud.",
  },
];

const rights = [
  "Conocer que informacion personal y medica esta almacenada.",
  "Actualizar o rectificar datos incompletos, desactualizados o incorrectos.",
  "Solicitar eliminacion cuando sea legal y tecnicamente procedente.",
  "Revocar autorizaciones de tratamiento cuando aplique.",
  "Solicitar informacion sobre el uso dado a sus datos.",
  "Conocer con quien se comparte informacion y bajo que autorizacion.",
];

export default function MedicalSecurityPage() {
  return (
    <main className="min-h-screen bg-[#f7fafc] text-[#181c1e]">
      <header className="border-b border-[#dfe3e8] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-[#002045]" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
            <span className="font-bold text-[#002045]">AppMiSalud Familia</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-[#13696a] md:inline-flex">
              Iniciar sesion
            </Link>
            <Link href="/register" className="rounded-full bg-[#002045] px-5 py-2 text-sm font-semibold text-white">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-12 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#a2eded]/45 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#13696a]">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            Normatividad colombiana y datos sensibles
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-[#002045] md:text-6xl" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            Seguridad de la informacion medica familiar
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#42474e]">
            AppMiSalud Familia esta disenada para tratar informacion de salud como dato personal sensible. Esta pagina explica, en lenguaje claro, los principios que guian la recoleccion, custodia, uso y eliminacion de informacion medica dentro de la aplicacion.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-full bg-[#002045] px-6 text-sm font-bold text-white">
              Crear boveda segura
            </Link>
            <a href="#marco-legal" className="inline-flex h-12 items-center justify-center rounded-full border-2 border-[#13696a] px-6 text-sm font-bold text-[#13696a]">
              Ver marco legal
            </a>
          </div>
        </div>

        <aside className="rounded-3xl border border-[#dfe3e8] bg-white p-6 shadow-[0px_4px_20px_rgba(26,54,93,0.08)]">
          <div className="rounded-2xl bg-[#002045] p-5 text-white">
            <span className="material-symbols-outlined text-5xl text-[#a5eff0]">health_and_safety</span>
            <h2 className="mt-4 text-2xl font-bold">Principio central</h2>
            <p className="mt-3 text-sm leading-6 text-[#d6e3ff]">
              Los datos de salud requieren un nivel reforzado de cuidado. Por eso el acceso debe ser autenticado, la finalidad debe ser clara y el usuario debe mantener control sobre su informacion.
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {["Dato sensible", "Autorizacion expresa", "Acceso controlado", "IA no diagnostica"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-[#f1f4f6] p-3">
                <span className="material-symbols-outlined text-[#13696a]">check_circle</span>
                <span className="text-sm font-semibold text-[#002045]">{item}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section id="marco-legal" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-12">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-[#002045]">Marco legal de referencia</h2>
            <p className="mt-3 text-[#42474e]">
              Esta pagina no sustituye asesoria juridica. Resume normas relevantes para orientar el diseno de seguridad, privacidad y consentimiento de la app.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {legalFramework.map((item) => (
              <a
                key={item.law}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-[#dfe3e8] bg-[#f8fafb] p-5 transition hover:border-[#13696a] hover:bg-[#a2eded]/10">
                <p className="text-xs font-bold uppercase tracking-wide text-[#13696a]">{item.law}</p>
                <h3 className="mt-2 text-lg font-bold text-[#002045]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#42474e]">{item.summary}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-12">
        <h2 className="text-3xl font-bold text-[#002045]">Como se traduce esto en la app</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {principles.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#dfe3e8] bg-white p-5 shadow-[0px_4px_20px_rgba(26,54,93,0.06)]">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#a2eded]/35">
                <span className="material-symbols-outlined text-[#13696a]">{item.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-[#002045]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#42474e]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#002045] py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2 md:px-12">
          <div>
            <h2 className="text-3xl font-bold">Derechos del usuario sobre sus datos</h2>
            <p className="mt-4 leading-7 text-[#d6e3ff]">
              AppMiSalud Familia debe facilitar canales para que cada titular ejerza control sobre sus datos personales y medicos.
            </p>
          </div>
          <ul className="grid gap-3">
            {rights.map((right) => (
              <li key={right} className="flex gap-3 rounded-xl bg-white/8 p-3">
                <span className="material-symbols-outlined text-[#a5eff0]">done</span>
                <span className="text-sm leading-6 text-[#eef1f3]">{right}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-12">
        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-[#ffdad6] bg-[#fff7f6] p-6">
            <span className="material-symbols-outlined text-4xl text-[#ba1a1a]">medical_information</span>
            <h2 className="mt-4 text-2xl font-bold text-[#93000a]">Aviso medico</h2>
            <p className="mt-3 leading-7 text-[#93000a]">
              Los resumenes o explicaciones generados con IA son apoyo informativo. No reemplazan la consulta, diagnostico, tratamiento o seguimiento de un medico u otro profesional de salud habilitado.
            </p>
          </article>
          <article className="rounded-3xl border border-[#dfe3e8] bg-white p-6">
            <span className="material-symbols-outlined text-4xl text-[#13696a]">admin_panel_settings</span>
            <h2 className="mt-4 text-2xl font-bold text-[#002045]">Compromisos operativos</h2>
            <p className="mt-3 leading-7 text-[#42474e]">
              La plataforma debe mantener reglas de acceso, minimizacion de datos, control de sesiones, trazabilidad de acciones sensibles y actualizacion continua de politicas de privacidad.
            </p>
          </article>
        </div>
      </section>

      <footer className="border-t border-[#dfe3e8] bg-white px-4 py-8 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#42474e] md:flex-row md:items-center md:justify-between">
          <p>© 2026 AppMiSalud Familia. Informacion orientativa, no asesoria juridica.</p>
          <Link href="/" className="font-semibold text-[#13696a]">
            Volver al inicio
          </Link>
        </div>
      </footer>
    </main>
  );
}
