import type { Metadata } from "next";
import Link from "next/link";
import { ShieldLogo } from "@/components/ShieldLogo";

export const metadata: Metadata = {
  title: "Politica de privacidad | MiSalud FamilIA",
  description:
    "Politica de privacidad y tratamiento de datos personales sensibles de MiSalud FamilIA para usuarios en Colombia.",
};

const quickPoints = [
  {
    icon: "health_and_safety",
    title: "Datos de salud sensibles",
    text: "Tratamos documentos y datos medicos como informacion sensible que requiere autorizacion expresa y medidas reforzadas.",
  },
  {
    icon: "verified_user",
    title: "Control del titular",
    text: "Puedes conocer, actualizar, rectificar, solicitar eliminacion o revocar autorizaciones cuando aplique.",
  },
  {
    icon: "lock",
    title: "Acceso autenticado",
    text: "La boveda esta asociada a tu cuenta. Otros usuarios solo acceden si existe una accion de compartir o autorizacion valida.",
  },
  {
    icon: "psychology",
    title: "IA responsable",
    text: "La IA ayuda a organizar y explicar informacion, pero no sustituye criterio medico profesional.",
  },
];

const dataCategories = [
  "Datos de identificacion y contacto: nombre, correo, foto de perfil y datos de autenticacion.",
  "Datos familiares: nombres, relaciones, edades aproximadas, contactos de emergencia y datos de personas a cargo.",
  "Datos medicos: documentos clinicos, resultados, formulas, vacunas, imagenes, notas y resumenes.",
  "Datos de uso: fecha de ingreso, carga de documentos, consumo de IA, almacenamiento usado y eventos de seguridad.",
  "Datos tecnicos: identificadores de sesion, dispositivo, navegador, direccion IP aproximada y registros de error.",
];

const purposes = [
  {
    title: "Crear y operar tu boveda familiar",
    text: "Guardar documentos, asociarlos a personas, organizarlos por tipo, fecha, institucion o profesional de salud.",
  },
  {
    title: "Generar apoyo informativo con IA",
    text: "Extraer texto, resumir documentos, detectar patrones informativos y crear explicaciones faciles de entender.",
  },
  {
    title: "Proteger la cuenta y prevenir abuso",
    text: "Validar identidad, controlar acceso, detectar errores, investigar incidentes y mantener trazabilidad operativa.",
  },
  {
    title: "Administrar planes y soporte",
    text: "Medir almacenamiento, documentos, consumo de IA, estado de prueba gratuita, pagos y solicitudes de asistencia.",
  },
];

const rights = [
  "Conocer que datos personales y medicos tenemos asociados a tu cuenta.",
  "Actualizar o rectificar informacion incompleta, desactualizada o incorrecta.",
  "Solicitar prueba de la autorizacion otorgada para tratamiento de datos.",
  "Solicitar informacion sobre el uso que se ha dado a tus datos.",
  "Revocar autorizaciones o solicitar eliminacion cuando sea legal y tecnicamente procedente.",
  "Presentar consultas o reclamos por los canales definidos por MiSalud FamilIA.",
];

const safeguards = [
  { icon: "key", label: "Autenticacion de usuario" },
  { icon: "rule", label: "Reglas de acceso por propietario" },
  { icon: "cloud_lock", label: "Almacenamiento protegido" },
  { icon: "history", label: "Trazabilidad operativa" },
  { icon: "data_object", label: "Minimizacion de datos para IA" },
  { icon: "admin_panel_settings", label: "Controles administrativos" },
];

const legalLinks = [
  {
    label: "Ley 1581 de 2012",
    href: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981",
  },
  {
    label: "Decreto 1377 de 2013",
    href: "https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646",
  },
  {
    label: "SIC: datos de salud sensibles",
    href: "https://sedeelectronica.sic.gov.co/comunicado/mediante-orden-administrativa-la-sic-busca-blindar-el-tratamiento-de-la-informacion-relacionada-con-la-salud-y-las-decisiones",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f7fafc] text-[#181c1e]">
      <header className="sticky top-0 z-40 border-b border-[#dfe3e8] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-12">
          <Link href="/" aria-label="Ir al inicio de MiSalud FamilIA">
            <ShieldLogo size={32} />
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/seguridad-informacion-medica" className="hidden text-sm font-semibold text-[#003A7A] md:inline-flex">
              Seguridad
            </Link>
            <Link href="/login" className="hidden text-sm font-semibold text-[#00B8A9] md:inline-flex">
              Iniciar sesion
            </Link>
            <Link href="/register" className="rounded-full bg-[#003A7A] px-5 py-2 text-sm font-semibold text-white">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:px-12 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#B3EDE8]/45 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#00B8A9]">
            <span className="material-symbols-outlined text-[18px]">privacy_tip</span>
            Politica de privacidad
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-[#003A7A] md:text-6xl" style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            Tu informacion medica merece control, claridad y proteccion.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#42474e]">
            Esta politica explica como MiSalud FamilIA recolecta, usa, almacena, protege y permite gestionar datos personales, familiares y medicos dentro de la boveda digital.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#derechos" className="inline-flex h-12 items-center justify-center rounded-full bg-[#003A7A] px-6 text-sm font-bold text-white">
              Ver tus derechos
            </a>
            <a href="#contacto" className="inline-flex h-12 items-center justify-center rounded-full border-2 border-[#00B8A9] px-6 text-sm font-bold text-[#00B8A9]">
              Contactar privacidad
            </a>
          </div>
        </div>

        <aside className="rounded-3xl border border-[#dfe3e8] bg-white p-6 shadow-[0px_4px_20px_rgba(26,54,93,0.08)]">
          <div className="rounded-2xl bg-[#003A7A] p-6 text-white">
            <span className="material-symbols-outlined text-5xl text-[#B3EDE8]">shield_lock</span>
            <h2 className="mt-4 text-2xl font-bold">Resumen claro</h2>
            <p className="mt-3 text-sm leading-6 text-[#d6e3ff]">
              Solo usamos tus datos para operar la boveda, proteger la cuenta, prestar soporte, administrar planes y generar funciones informativas autorizadas.
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            {quickPoints.map((item) => (
              <div key={item.title} className="rounded-xl bg-[#f1f4f6] p-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#00B8A9]">{item.icon}</span>
                  <h3 className="font-bold text-[#003A7A]">{item.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#42474e]">{item.text}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-12">
          <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h2 className="text-3xl font-bold text-[#003A7A]">Datos que podemos tratar</h2>
              <p className="mt-3 leading-7 text-[#42474e]">
                La cantidad de informacion depende de lo que decidas registrar, subir o autorizar dentro de la app.
              </p>
            </div>
            <div className="grid gap-3">
              {dataCategories.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-[#dfe3e8] bg-[#f8fafb] p-4">
                  <span className="material-symbols-outlined text-[#00B8A9]">check_circle</span>
                  <p className="text-sm leading-6 text-[#42474e]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-12">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-[#003A7A]">Finalidades del tratamiento</h2>
          <p className="mt-3 text-[#42474e]">
            No vendemos informacion medica. El tratamiento debe estar ligado a finalidades claras, informadas y necesarias para el servicio.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {purposes.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#dfe3e8] bg-white p-5 shadow-[0px_4px_20px_rgba(26,54,93,0.06)]">
              <h3 className="text-lg font-bold text-[#003A7A]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#42474e]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#003A7A] py-14 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2 md:px-12">
          <div>
            <span className="material-symbols-outlined text-5xl text-[#B3EDE8]">medical_information</span>
            <h2 className="mt-4 text-3xl font-bold">Tratamiento de datos sensibles</h2>
            <p className="mt-4 leading-7 text-[#d6e3ff]">
              Los datos relativos a salud son sensibles. Su uso requiere especial cuidado, autorizacion expresa y medidas que reduzcan accesos no autorizados, perdida, alteracion o divulgacion indebida.
            </p>
          </div>
          <div className="rounded-3xl bg-white/10 p-6">
            <h3 className="text-xl font-bold">IA y documentos medicos</h3>
            <p className="mt-3 leading-7 text-[#eef1f3]">
              Cuando autorizas funciones de IA, la plataforma puede procesar texto extraido de documentos para generar clasificacion, resumenes o explicaciones. Estos resultados son informativos y no reemplazan diagnostico ni atencion medica.
            </p>
            <Link href="/seguridad-informacion-medica" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#B3EDE8] px-5 text-sm font-bold text-[#002020]">
              Ver pagina de seguridad
            </Link>
          </div>
        </div>
      </section>

      <section id="derechos" className="mx-auto max-w-7xl px-4 py-14 md:px-12">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-bold text-[#003A7A]">Derechos del titular</h2>
            <p className="mt-3 leading-7 text-[#42474e]">
              Conforme al regimen colombiano de proteccion de datos personales, puedes ejercer derechos sobre tu informacion.
            </p>
          </div>
          <ul className="grid gap-3">
            {rights.map((right) => (
              <li key={right} className="flex gap-3 rounded-xl bg-white p-4 shadow-[0px_4px_20px_rgba(26,54,93,0.05)]">
                <span className="material-symbols-outlined text-[#00B8A9]">done</span>
                <span className="text-sm leading-6 text-[#42474e]">{right}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-12">
          <h2 className="text-3xl font-bold text-[#003A7A]">Medidas de proteccion</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            {safeguards.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#dfe3e8] bg-[#f8fafb] p-5 text-center">
                <span className="material-symbols-outlined text-4xl text-[#00B8A9]">{item.icon}</span>
                <p className="mt-3 text-sm font-bold text-[#003A7A]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-12">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-[#dfe3e8] bg-white p-6">
            <h2 className="text-2xl font-bold text-[#003A7A]">Conservacion</h2>
            <p className="mt-3 leading-7 text-[#42474e]">
              Conservamos datos mientras tu cuenta este activa, mientras sean necesarios para prestar el servicio o mientras exista una obligacion legal, tecnica o de seguridad.
            </p>
          </article>
          <article className="rounded-3xl border border-[#dfe3e8] bg-white p-6">
            <h2 className="text-2xl font-bold text-[#003A7A]">Comparticion</h2>
            <p className="mt-3 leading-7 text-[#42474e]">
              No compartimos datos medicos con terceros sin autorizacion, salvo requerimiento legal, soporte tecnico necesario o integraciones autorizadas por el usuario.
            </p>
          </article>
          <article className="rounded-3xl border border-[#dfe3e8] bg-white p-6">
            <h2 className="text-2xl font-bold text-[#003A7A]">Menores y familiares</h2>
            <p className="mt-3 leading-7 text-[#42474e]">
              Quien registra familiares declara tener autorizacion o facultad suficiente para administrar la informacion de personas a cargo.
            </p>
          </article>
        </div>
      </section>

      <section id="contacto" className="bg-[#f1f4f6] py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-[1fr_0.9fr] md:px-12">
          <div className="rounded-3xl bg-[#003A7A] p-8 text-white">
            <span className="material-symbols-outlined text-5xl text-[#B3EDE8]">support_agent</span>
            <h2 className="mt-4 text-3xl font-bold">Canal de privacidad</h2>
            <p className="mt-4 leading-7 text-[#d6e3ff]">
              Para consultas, reclamos o solicitudes sobre datos personales, contacta al equipo responsable de privacidad de MiSalud FamilIA.
            </p>
            <a
              href="https://wa.me/573124020210?text=Hola%2C%20tengo%20una%20solicitud%20sobre%20privacidad%20y%20datos%20personales%20en%20MiSalud%20FamilIA"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#25D366] px-6 text-sm font-bold text-white"
            >
              WhatsApp 312 402 0210
            </a>
          </div>
          <div className="rounded-3xl border border-[#dfe3e8] bg-white p-8">
            <h2 className="text-2xl font-bold text-[#003A7A]">Referencias normativas</h2>
            <p className="mt-3 text-sm leading-6 text-[#42474e]">
              La politica se inspira en principios de la Ley 1581 de 2012, su reglamentacion y criterios de la autoridad colombiana de proteccion de datos.
            </p>
            <div className="mt-5 grid gap-3">
              {legalLinks.map((item) => (
                <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-[#dfe3e8] px-4 py-3 text-sm font-bold text-[#003A7A] hover:border-[#00B8A9]">
                  {item.label}
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dfe3e8] bg-white px-4 py-8 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#42474e] md:flex-row md:items-center md:justify-between">
          <p>© 2026 MiSalud FamilIA. Politica informativa sujeta a actualizacion.</p>
          <div className="flex gap-4">
            <Link href="/" className="font-semibold text-[#00B8A9]">Inicio</Link>
            <Link href="/seguridad-informacion-medica" className="font-semibold text-[#00B8A9]">Seguridad</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
