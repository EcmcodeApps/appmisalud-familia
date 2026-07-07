"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";

interface PersonaProfile {
  name: string;
  role: string;
  birthDate: string;
  sex: string;
  bloodType: string;
  eps: string;
  allergies: string;
  diagnoses: string;
  medications: string;
  doctor: string;
  emergencyName: string;
  emergencyPhone: string;
  specialCondition: string;
  careNotes: string;
}

const EMPTY: PersonaProfile = {
  name: "", role: "", birthDate: "", sex: "", bloodType: "",
  eps: "", allergies: "", diagnoses: "", medications: "",
  doctor: "", emergencyName: "", emergencyPhone: "",
  specialCondition: "", careNotes: "",
};

export default function EditarPersonaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState<PersonaProfile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { router.replace("/login"); return; }

    getDoc(doc(db, "users", uid, "personas", id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setForm({
          name: d.name ?? "",
          role: d.role ?? "",
          birthDate: d.birthDate ?? "",
          sex: d.sex ?? "",
          bloodType: d.bloodType ?? "",
          eps: d.eps ?? "",
          allergies: d.allergies ?? "",
          diagnoses: d.diagnoses ?? "",
          medications: d.medications ?? "",
          doctor: d.doctor ?? "",
          emergencyName: d.emergencyName ?? "",
          emergencyPhone: d.emergencyPhone ?? "",
          specialCondition: d.specialCondition ?? "",
          careNotes: d.careNotes ?? "",
        });
      }
      setLoading(false);
    });
  }, [id, router]);

  function set(field: keyof PersonaProfile) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, "users", uid, "personas", id),
        { ...form, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setShowModal(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="material-symbols-outlined text-[#003A7A] text-5xl animate-pulse"
          style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
      </div>
    );
  }

  return (
    <>
      {/* Background atmosphere */}
      <div className="fixed inset-0 -z-10 pointer-events-none opacity-40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(162,237,237,0.2)", transform: "translate(50%,-25%)" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ backgroundColor: "rgba(0,32,69,0.05)", transform: "translate(-25%,25%)" }} />
      </div>

      {/* Custom header (overrides shell header visually on mobile) */}
      <div className="sticky top-16 z-40 flex items-center justify-between px-4 md:px-12 h-14"
        style={{ backgroundColor: "rgba(247,250,252,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(196,198,207,0.3)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-[#ebeef0] transition-colors active:scale-95">
            <span className="material-symbols-outlined text-[#003A7A]">arrow_back</span>
          </button>
          <h1 className="font-bold text-lg text-[#003A7A]"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            Editar Perfil Familiar
          </h1>
        </div>
        <span className="material-symbols-outlined text-[#00B8A9]"
          style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
      </div>

      <div className="px-4 md:px-12 max-w-2xl mx-auto py-6 space-y-6">

        {/* Disclaimer */}
        <div className="flex gap-3 items-start p-4 rounded-xl border-l-4"
          style={{ backgroundColor: "rgba(162,237,237,0.2)", borderColor: "#00B8A9" }}>
          <span className="material-symbols-outlined text-[#00B8A9] shrink-0">info</span>
          <p className="text-sm font-semibold text-[#00968A]">
            Estos datos son sensibles. Puedes dejar campos vacíos y completarlos después. La privacidad de tu familia es nuestra prioridad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Información Básica */}
          <Card icon="badge" title="Información Básica">
            <Field label="Nombre completo">
              <input value={form.name} onChange={set("name")}
                className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white"
                placeholder="Ej. Ana García" type="text" />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Relación">
                <select value={form.role} onChange={set("role")}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white appearance-none">
                  <option value="">Seleccionar…</option>
                  <option value="Titular">Titular (Yo)</option>
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Cónyuge">Cónyuge</option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </Field>
              <Field label="Fecha de nacimiento">
                <input value={form.birthDate} onChange={set("birthDate")}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white"
                  type="date" />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Sexo (Opcional)">
                <select value={form.sex} onChange={set("sex")}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white appearance-none">
                  <option value="">Prefiero no decir</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Otro">Otro</option>
                </select>
              </Field>
              <Field label="Tipo de sangre">
                <select value={form.bloodType} onChange={set("bloodType")}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white appearance-none">
                  <option value="">Desconocido</option>
                  {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          {/* Historial Médico */}
          <Card icon="medical_information" title="Historial Médico">
            <Field label="EPS o Aseguradora">
              <input value={form.eps} onChange={set("eps")}
                className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white"
                placeholder="Ej. Sura, Sanitas, Mapfre" type="text" />
            </Field>
            <Field label="Alergias" icon="auto_awesome">
              <textarea value={form.allergies} onChange={set("allergies")}
                className="w-full p-4 border border-[#c4c6cf] rounded-xl bg-white resize-none"
                placeholder="Ej. Penicilina, Nueces, Polen…" rows={2} />
            </Field>
            <Field label="Diagnósticos actuales">
              <textarea value={form.diagnoses} onChange={set("diagnoses")}
                className="w-full p-4 border border-[#c4c6cf] rounded-xl bg-white resize-none"
                placeholder="Ej. Hipertensión arterial, Diabetes tipo 2…" rows={2} />
            </Field>
            <Field label="Medicamentos activos">
              <textarea value={form.medications} onChange={set("medications")}
                className="w-full p-4 border border-[#c4c6cf] rounded-xl bg-white resize-none"
                placeholder="Ej. Losartán 50mg (1 cada 12h)…" rows={2} />
            </Field>
          </Card>

          {/* Cuidado y Contactos */}
          <Card icon="contact_emergency" title="Cuidado y Contactos">
            <Field label="Médico tratante">
              <input value={form.doctor} onChange={set("doctor")}
                className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white"
                placeholder="Nombre y especialidad" type="text" />
            </Field>
            <Field label="Contacto de emergencia">
              <div className="grid grid-cols-2 gap-4">
                <input value={form.emergencyName} onChange={set("emergencyName")}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white"
                  placeholder="Nombre" type="text" />
                <input value={form.emergencyPhone} onChange={set("emergencyPhone")}
                  className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white"
                  placeholder="Teléfono" type="tel" />
              </div>
            </Field>
            <Field label="Condición especial o discapacidad">
              <input value={form.specialCondition} onChange={set("specialCondition")}
                className="w-full h-12 px-4 border border-[#c4c6cf] rounded-xl bg-white"
                placeholder="Describir brevemente" type="text" />
            </Field>
            <Field label="Notas del cuidador">
              <textarea value={form.careNotes} onChange={set("careNotes")}
                className="w-full p-4 border border-[#c4c6cf] rounded-xl bg-white resize-none"
                placeholder="Instrucciones diarias, preferencias, o rutinas de cuidado…" rows={3} />
            </Field>
          </Card>

          {/* Trust badge */}
          <div className="flex justify-center items-center gap-2 py-2">
            <span className="p-1 rounded-full" style={{ backgroundColor: "rgba(19,105,106,0.1)" }}>
              <span className="material-symbols-outlined text-[#00B8A9] text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </span>
            <span className="text-xs font-medium text-[#00B8A9]">Tus datos están encriptados de extremo a extremo.</span>
          </div>

          {/* Submit */}
          <div className="pb-6">
            <button type="submit" disabled={saving}
              className="w-full h-14 text-white font-semibold text-base rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-60"
              style={{ backgroundColor: "#003A7A", boxShadow: "0 4px 12px rgba(0,32,69,0.2)" }}>
              {saving ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  Guardar perfil
                  <span className="material-symbols-outlined">save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(45,49,51,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white p-8 rounded-3xl max-w-xs w-full text-center space-y-4"
            style={{ boxShadow: "0 24px 48px rgba(0,32,69,0.2)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: "rgba(19,105,106,0.1)" }}>
              <span className="material-symbols-outlined text-[#00B8A9] text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-[#003A7A]"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              ¡Perfil Guardado!
            </h3>
            <p className="text-sm text-[#43474e]">
              La información de tu familiar ha sido actualizada de forma segura.
            </p>
            <button
              onClick={() => { setShowModal(false); router.push("/personas"); }}
              className="w-full py-3 text-white font-semibold rounded-xl"
              style={{ backgroundColor: "#003A7A" }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-6 space-y-4 border border-[rgba(196,198,207,0.3)]"
      style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-[#003A7A]"
          style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#005EB8]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, icon, children }: { label: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-sm font-semibold text-[#43474e]">
        {label}
        {icon && (
          <span className="material-symbols-outlined text-[#00B8A9] text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        )}
      </label>
      {children}
    </div>
  );
}
