"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    // Marcar invisibles solo después de confirmar que el observer puede actuar
    els.forEach((el) => {
      el.classList.add("transition-all", "duration-700");
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "none";
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -50px 0px" }
    );
    els.forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
      (el as HTMLElement).style.transform = "translateY(20px)";
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-[Inter] text-[#181c1e] selection:bg-[#a2eded]">
      <Header />
      <main className="pt-16 overflow-hidden">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <CaregiverSection />
        <SecuritySection />
        <CtaSection />
      </main>
      <Footer />
      <MobileNav />
      <MobileFab />
    </div>
  );
}

function Header() {
  return (
    <header className="fixed top-0 w-full z-50 glass-header shadow-sm h-16 flex justify-between items-center px-4 md:px-12">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#002045] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          shield_with_heart
        </span>
        <h1 className="font-bold text-[#002045] text-lg md:text-xl font-[Atkinson_Hyperlegible_Next]">
          AppMiSalud Familia
        </h1>
      </div>
      <nav className="hidden md:flex gap-8 items-center">
        <a className="text-sm text-[#42474e] hover:text-[#002045] transition-colors" href="#solucion">Solución</a>
        <a className="text-sm text-[#42474e] hover:text-[#002045] transition-colors" href="#seguridad">Seguridad</a>
        <Link
          href="/register"
          className="bg-[#002045] text-white px-6 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Crear mi cuenta
        </Link>
      </nav>
      <button className="md:hidden p-2 text-[#42474e]" aria-label="Menú">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[751px] flex items-center pt-12 pb-24 px-4 md:px-12">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div data-reveal className="z-10 order-2 md:order-1">
          <span className="inline-flex items-center gap-2 bg-[#a2eded] text-[#1a6d6e] px-4 py-1.5 rounded-full text-xs font-medium mb-6">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            Bóveda Médica Segura
          </span>
          <h2 className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-4xl md:text-6xl leading-[1.1] mb-6">
            Tu bóveda médica familiar, organizada y segura.
          </h2>
          <p className="text-[#42474e] mb-10 max-w-lg text-lg">
            Guarda, consulta, compara y comparte la historia médica de las personas que cuidas desde un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="bg-[#002045] text-white h-14 px-8 rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Crear mi cuenta
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <a
              href="#solucion"
              className="border-[1.5px] border-[#13696a] text-[#13696a] h-14 px-8 rounded-xl font-medium flex items-center justify-center hover:bg-[#a2eded]/20 transition-all"
            >
              Ver cómo funciona
            </a>
          </div>
          <div className="mt-8 flex items-center gap-4 text-[#42474e] opacity-70">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[20px]">lock</span>
              <span className="text-xs">Encriptación de punta a punta</span>
            </div>
            <div className="w-px h-4 bg-[#c4c6cf]" />
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[20px]">group</span>
              <span className="text-xs">Perfiles ilimitados</span>
            </div>
          </div>
        </div>

        <div data-reveal className="order-1 md:order-2 relative h-full">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#a2eded] rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#c3e8fd] rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none" />
          <div className="relative rounded-3xl overflow-hidden medical-vault-shadow border border-white/40">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTcjLstynriSFEaQ3P94U1Obq8pNMucAF4fsyJbqy4rVlXgXk8krcdFvcWyNIFRGRtd_6pioB4LlK_norujdJnCEYKngpCEoQ3FAPiZXXldLzcoIEO7CdcoVVatqOuDqo-B3gG1omfjLzNDqVywNSA10rHC_54sYitXEKIZ3Z_-xtQ4lO4454bWTDnsUoGm55a0gbVs754y-IKDuuy6H2A9tlhNSrQ1B97k9mV0itnypyNFWuVJ-KPhIkfYlv1Q0ed65e740eRAy9"
              alt="Médico y familia"
              width={800}
              height={600}
              className="w-full aspect-[4/3] object-cover"
              priority
            />
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 border border-white">
              <div className="bg-[#a2eded] p-2 rounded-full">
                <span className="material-symbols-outlined text-[#13696a]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  folder_managed
                </span>
              </div>
              <div>
                <p className="font-medium text-[#002045] text-sm">Historial Actualizado</p>
                <p className="text-xs text-[#42474e]">Último reporte cargado hace 5 min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems = [
    {
      icon: "running_with_errors",
      title: "Información dispersa",
      desc: "Resultados en correos, recetas en WhatsApp y carnet de vacunación en un cajón olvidado.",
    },
    {
      icon: "emergency",
      title: "Olvidos críticos",
      desc: "No recordar el nombre exacto de la medicación o la fecha de la última cirugía en una urgencia.",
    },
    {
      icon: "person_search",
      title: "Carga mental",
      desc: "El estrés de ser el único que sabe dónde está todo cuando alguien más debe cuidar a tu familiar.",
    },
  ];

  return (
    <section className="py-24 bg-[#f1f4f6] px-4 md:px-12">
      <div data-reveal className="max-w-4xl mx-auto text-center mb-16">
        <h3 className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-3xl md:text-4xl mb-4">
          ¿Papeles perdidos y carpetas infinitas?
        </h3>
        <p className="text-[#42474e] text-lg">
          Mantener el control de la salud familiar no debería ser un caos administrativo.
        </p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {problems.map((p) => (
          <div key={p.title} data-reveal className="bg-white p-8 rounded-2xl medical-vault-shadow border-b-4 border-[#ffdad6]">
            <span className="material-symbols-outlined text-[#ba1a1a] text-4xl mb-4 block">{p.icon}</span>
            <h4 className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-xl mb-3">{p.title}</h4>
            <p className="text-[#42474e]">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="py-24 px-4 md:px-12" id="solucion">
      <div className="max-w-7xl mx-auto">
        <div data-reveal className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h3 className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-3xl md:text-4xl mb-4">
              Una solución organizada por personas.
            </h3>
            <p className="text-[#42474e] text-lg">
              Centraliza toda la vida médica de tu familia en perfiles individuales protegidos.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-[#1a365d] text-[#86a0cd] px-6 py-3 rounded-2xl border border-[#002045]/20">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-sm font-medium">IA Responsable: Análisis preventivo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
          {/* Tarjeta principal */}
          <div data-reveal className="md:col-span-7 bg-white rounded-3xl medical-vault-shadow p-8 flex flex-col justify-between border border-[#c4c6cf]/30 overflow-hidden relative">
            <div className="relative z-10">
              <h4 className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-2xl mb-4">
                Perfiles Familiares Dinámicos
              </h4>
              <p className="text-[#42474e] mb-8 max-w-sm">
                Crea un espacio único para tus hijos, padres o para ti mismo. Filtra por fechas, síntomas o médicos.
              </p>
              <div className="flex -space-x-4 mb-8">
                {["M", "J", "A"].map((letter, i) => (
                  <div
                    key={letter}
                    className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center font-bold text-[#002045]"
                    style={{ backgroundColor: ["#a5eff0", "#c3e8fd", "#d6e3ff"][i] }}
                  >
                    {letter}
                  </div>
                ))}
                <div className="w-14 h-14 rounded-full border-4 border-white bg-[#e5e9eb] flex items-center justify-center text-[#42474e]">
                  <span className="material-symbols-outlined">add</span>
                </div>
              </div>
            </div>
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBriicwrcn-rmixXOJH8pnerh3Ls5kScZonrk9wJY2q-I6atyiJzobSciO_vANUuHlcLgzK5TjLkiDwP6Xv0_u7Z7OZ9hCTL0GU8ZPZpM61OkZZ4_voWrYf1Bg7JDqvivoKwLLPhclBWh5iBVJkDQFL5xCn3rXvqYk7-R2ODnFSJVos9abw_KfExLdwwOYNu9EcuUq8skk_wfH5XwNz0_Y0AKARghPsIzic7syjVLi7px1VoHOf4eMyG-LIzOH26Xcf6F4nYQAenhqN"
              alt="Interfaz de la app"
              width={600}
              height={400}
              className="absolute bottom-0 right-0 w-2/3 object-contain translate-y-10 translate-x-10 rounded-tl-3xl shadow-2xl"
            />
          </div>

          {/* Columna derecha */}
          <div className="md:col-span-5 grid grid-rows-2 gap-6">
            <div data-reveal className="bg-[#a2eded]/30 rounded-3xl p-8 border border-[#13696a]/10">
              <span className="material-symbols-outlined text-[#13696a] text-4xl mb-4 block">analytics</span>
              <h4 className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-xl mb-2">Compara Evoluciones</h4>
              <p className="text-[#42474e]">
                Observa gráficos automáticos de laboratorios. ¿El colesterol bajó desde la última vez? AppMiSalud te lo dice.
              </p>
            </div>
            <div data-reveal className="bg-[#002432] text-white rounded-3xl p-8 relative overflow-hidden">
              <h4 className="font-[Atkinson_Hyperlegible_Next] font-bold text-xl mb-2">Compartir Seguro</h4>
              <p className="opacity-80 mb-6">
                Genera un acceso temporal para médicos o cuidadores. Tú controlas quién ve qué y por cuánto tiempo.
              </p>
              <span className="material-symbols-outlined text-8xl absolute bottom-0 right-0 opacity-10 translate-y-6 translate-x-6">key</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { icon: "person_add", label: "1. Crea Perfiles", desc: "Configura a los miembros de tu familia." },
    { icon: "upload_file", label: "2. Sube Documentos", desc: "Toma fotos o sube PDFs de exámenes." },
    { icon: "neurology", label: "3. IA Organiza", desc: "Nuestra IA extrae datos y los clasifica." },
    { icon: "task_alt", label: "4. Control Total", desc: "Consulta la cronología completa de salud." },
  ];

  return (
    <section className="py-24 bg-[#f7fafc] px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        <h3 data-reveal className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-3xl md:text-4xl text-center mb-16">
          El camino a la tranquilidad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-0 w-full h-[1.5px] bg-[#c4c6cf] -z-10" />
          {steps.map((s) => (
            <div key={s.label} data-reveal className="flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-full bg-white medical-vault-shadow flex items-center justify-center mb-6 border-2 border-transparent group-hover:border-[#13696a] transition-all">
                <span className="material-symbols-outlined text-[#002045] text-4xl">{s.icon}</span>
              </div>
              <p className="font-semibold text-[#002045] mb-2">{s.label}</p>
              <p className="text-[#42474e] text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CaregiverSection() {
  return (
    <section className="py-24 px-4 md:px-12 overflow-hidden">
      <div className="max-w-7xl mx-auto bg-[#1a365d] rounded-[2rem] p-12 md:p-24 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div data-reveal className="z-10">
            <h3 className="font-[Atkinson_Hyperlegible_Next] font-bold text-white text-3xl md:text-4xl mb-6">
              Diseñado para quienes cuidan.
            </h3>
            <p className="text-[#d6e3ff] mb-8 text-lg">
              Sabemos que la responsabilidad de la salud familiar suele recaer en una persona.
              Hemos creado herramientas para que esa carga sea más ligera.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                "Recordatorios inteligentes de medicamentos y citas.",
                "Exportación rápida de perfiles para urgencias.",
                "Comparte el progreso con otros familiares.",
              ].map((item) => (
                <li key={item} className="flex items-center gap-4 text-white">
                  <span className="material-symbols-outlined text-[#a5eff0]">check_circle</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-[#a5eff0] text-[#002020] h-14 px-8 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Empezar hoy mismo
            </Link>
          </div>

          <div data-reveal className="relative">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrJNgM_aUM5Sfrye__HDPJmQWnVX4wwn9edOPZ11aU-E0lZ_gRscuUFBnK_PWtCyhvfRpzaEntkHnBz6ZfiMxgP8zMUAI5Ht--vCWCiZNVCM3oVDpruxtjAHUkFatmesOr_HLd5moKko1yjyGAKrZGyj5rF_jMzJSmSjMlG-dkiv0xusH0VZEzo7AEIb0a4L6CNrClJL98l8G2cdhyBos_iltCU8A5N4IEHK6495DiM1Qp5tRzFPr7HCa3Everk2h11h6T1FQNGPSm"
              alt="Cuidadora familiar"
              width={600}
              height={400}
              className="rounded-3xl medical-vault-shadow w-full h-[400px] object-cover"
            />
            <div className="absolute -top-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-[#c4c6cf] max-w-[200px]">
              <p className="text-xs font-semibold text-[#002045] uppercase tracking-wider mb-2">Confianza</p>
              <p className="text-sm text-[#42474e] italic">
                &quot;Ahora sé que si algo pasa, toda la información está a un clic.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const items = [
    { icon: "lock_reset", label: "Encriptación AES-256" },
    { icon: "privacy_tip", label: "Cumplimiento HIPAA" },
    { icon: "fingerprint", label: "Biometría Nativa" },
    { icon: "cloud_done", label: "Respaldos Diarios" },
  ];

  const badges = [
    { icon: "security", label: "DATOS PROTEGIDOS" },
    { icon: "gpp_good", label: "GDPR COMPLIANT" },
    { icon: "health_and_safety", label: "ISO 27001" },
  ];

  return (
    <section className="py-24 bg-[#f1f4f6] px-4 md:px-12" id="seguridad">
      <div className="max-w-7xl mx-auto text-center">
        <span data-reveal className="material-symbols-outlined text-[#002045] text-6xl mb-6 block">verified_user</span>
        <h3 data-reveal className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-3xl md:text-4xl mb-6">
          Tu privacidad es nuestra prioridad absoluta.
        </h3>
        <p data-reveal className="text-[#42474e] text-lg max-w-3xl mx-auto mb-16">
          Aplicamos estándares de seguridad bancaria y cumplimos con regulaciones internacionales de protección de datos médicos.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item) => (
            <div key={item.label} data-reveal className="p-6 bg-white rounded-2xl border border-[#c4c6cf]/30 flex flex-col items-center">
              <div className="w-12 h-12 bg-[#1a365d]/10 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#002045]">{item.icon}</span>
              </div>
              <p className="font-semibold text-[#002045] text-sm text-center">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
          {badges.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="material-symbols-outlined">{b.icon}</span>
              <span className="font-bold text-sm">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-24 px-4 md:px-12 text-center">
      <div data-reveal className="max-w-4xl mx-auto bg-gradient-to-br from-[#f7fafc] to-[#a2eded]/20 p-12 md:p-24 rounded-[3rem] border border-[#13696a]/10">
        <h3 className="font-[Atkinson_Hyperlegible_Next] font-bold text-[#002045] text-4xl md:text-5xl mb-6">
          ¿Listo para organizar el cuidado de tu familia?
        </h3>
        <p className="text-[#42474e] text-lg mb-12">
          Únete a más de 10,000 familias que ya protegen su historia médica en la bóveda más segura de Latam.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/register"
            className="bg-[#002045] text-white h-16 px-12 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
          >
            Empezar Gratis
          </Link>
          <button className="bg-white text-[#002045] h-16 px-12 rounded-2xl font-semibold text-lg border border-[#c4c6cf] medical-vault-shadow hover:bg-[#f1f4f6] transition-all flex items-center justify-center">
            Hablar con Soporte
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#002045] text-white py-16 px-4 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#a5eff0] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
            <h2 className="font-bold text-xl">AppMiSalud Familia</h2>
          </div>
          <p className="text-sm opacity-70 leading-relaxed">
            La plataforma digital líder para la gestión y protección de la información médica familiar.
          </p>
        </div>
        <div>
          <h5 className="font-bold mb-6">Producto</h5>
          <ul className="space-y-4 text-sm opacity-70">
            {["Características", "Seguridad", "Planes", "IA Responsable"].map((item) => (
              <li key={item}><a className="hover:opacity-100 transition-opacity" href="#">{item}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-6">Compañía</h5>
          <ul className="space-y-4 text-sm opacity-70">
            {["Sobre Nosotros", "Blog de Salud", "Contacto"].map((item) => (
              <li key={item}><a className="hover:opacity-100 transition-opacity" href="#">{item}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-6">Legal</h5>
          <ul className="space-y-4 text-sm opacity-70">
            <li><Link href="/politica-privacidad" className="hover:opacity-100 transition-opacity">Privacidad</Link></li>
            <li><a className="hover:opacity-100 transition-opacity" href="#">Términos</a></li>
            <li><a className="hover:opacity-100 transition-opacity" href="#">Cookies</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
        <p>© 2026 AppMiSalud Familia. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          {["Twitter", "LinkedIn", "Instagram"].map((s) => (
            <a key={s} href="#">{s}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function MobileNav() {
  const items = [
    { icon: "home", label: "Inicio", active: true },
    { icon: "folder_managed", label: "Bóveda", active: false },
    { icon: "auto_awesome", label: "AI Salud", active: false },
    { icon: "medical_services", label: "Emergencia", active: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#c4c6cf] flex justify-around items-center md:hidden z-[60]">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex flex-col items-center ${item.active ? "text-[#002045]" : "text-[#42474e] opacity-60"}`}
        >
          <span
            className="material-symbols-outlined"
            style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {item.icon}
          </span>
          <span className={`text-[10px] ${item.active ? "font-bold" : ""}`}>{item.label}</span>
        </div>
      ))}
    </nav>
  );
}

function MobileFab() {
  return (
    <div className="fixed bottom-20 right-6 md:hidden z-50">
      <Link
        href="/register"
        className="bg-[#13696a] text-white w-16 h-16 rounded-full medical-vault-shadow flex items-center justify-center active:scale-90 transition-transform"
        aria-label="Crear cuenta"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </Link>
    </div>
  );
}
