"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";

interface Persona {
  id: string;
  name: string;
  role: string;
  birthYear: number;
  sex: string;
  photoURL?: string;
  lastDocument?: string;
  alertStatus: "ok" | "warning";
  alertLabel?: string;
  isOwner?: boolean;
}

const ROLES = ["Titular", "Madre", "Padre", "Hijo", "Hija", "Abuela", "Abuelo", "Tío", "Tía", "Cuidador", "Otro"];
const SEXES = ["Femenino", "Masculino", "Prefiero no indicar"];

const DEMO_AVATARS: Record<string, string> = {
  "María González": "https://lh3.googleusercontent.com/aida-public/AB6AXuA8BvOpOAYcUoBuYhc35OKHolx3j5oHTQ0caxerwtx48X3Eqk8Syom_ni5XP5xm13v_YOEMolRE8sAb2TrPAsnjnyC-RpDyB7-eCSI1WoWxbL9pfzIGbGhIB7XCF9FUKJZzsOi19ld82K7E3NrXL98c5DDtdH_wiT99FmFWZPNLSSZt0DkYUYluvFgU9jad-rllU_9P26f2V1lLFn-CLMM3519pScGIlk45eE5aOY3yKmL-2gB1hvy8fjAu-RUdU1Ow-adS7qBafeoy",
  "Ricardo González": "https://lh3.googleusercontent.com/aida-public/AB6AXuB3umujvOvw1QaBxNEPod-coQo53tLUJ8ayONQ_YpetwUVJIoo3i_0dOmBhOwR5nmKkClZfOUqgHgRHpQQd0AWtXWDHiXMnlcS7E-Fkj5jlHuyu0RrTp2xnttnkHityOWcAGlOoUtC1KU1VUhJJixVS5cWi6LWBb2bwk-IvCEIYWjpTPbbAtB4T9qgtR7kf_v5vMVDnE5slvI6qFPwoh7gjlIDYyNqrRNAk0Kdm7c1cV2iA2y4GK7OQYmFu4sCgoHAiv6szhepD5Cn2",
  "Mateo G.": "https://lh3.googleusercontent.com/aida-public/AB6AXuA59AZqH8IsQW2V-pYzIMZ3emwQ9zlPk4P0OW9dCZV-rU7hcWx6l-Cjq-JchYifnAOFPbsLDMrsdbgVAYNbkHsQVIj5Bau18WyEK9F1toqKOuIeP3tl6mmKpLtPTk-sXJwweBIOYOXEZKvL0QBFvs1V4iku1i5DaP2bpgpX6--ebMh28KECYV8acRH939rcW43YKc8wK91bQ8tOyww8yoMkJj1I0J6-O9wnZyiMyLYdKif-4jRRWMsYdV3uf_02G_dQX5kyXHqgN4YM",
};

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Persona | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", role: "Hijo", birthYear: new Date().getFullYear() - 30,
    sex: "Femenino", lastDocument: "", alertStatus: "ok" as "ok" | "warning", alertLabel: "",
  });

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "users", uid, "personas"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setPersonas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Persona)));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", role: "Hijo", birthYear: new Date().getFullYear() - 10, sex: "Femenino", lastDocument: "", alertStatus: "ok", alertLabel: "" });
    setShowModal(true);
  }

  function openEdit(p: Persona) {
    setEditing(p);
    setForm({ name: p.name, role: p.role, birthYear: p.birthYear, sex: p.sex, lastDocument: p.lastDocument || "", alertStatus: p.alertStatus, alertLabel: p.alertLabel || "" });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    try {
      const data = { ...form, updatedAt: serverTimestamp() };
      if (editing) {
        await updateDoc(doc(db, "users", uid, "personas", editing.id), data);
      } else {
        await addDoc(collection(db, "users", uid, "personas"), { ...data, isOwner: false, createdAt: serverTimestamp() });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!uid || !confirmDelete) return;
    await deleteDoc(doc(db, "users", uid, "personas", confirmDelete.id));
    setConfirmDelete(null);
  }

  const age = (p: Persona) => new Date().getFullYear() - p.birthYear;

  return (
    <div className="px-4 md:px-12 max-w-7xl mx-auto py-6">

      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-bold text-[#002045] mb-1"
            style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
            Personas bajo mi cuidado
          </h2>
          <p className="text-[#43474e] text-lg">Gestiona la salud y los permisos de tu círculo familiar.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ backgroundColor: "#002045", boxShadow: "0 4px 12px rgba(0,32,69,0.2)" }}>
          <span className="material-symbols-outlined">person_add</span>
          Agregar persona
        </button>
      </div>

      {/* Banner de privacidad */}
      <div className="p-4 rounded-2xl flex items-start gap-4 mb-8 border"
        style={{ backgroundColor: "#1a365d", borderColor: "rgba(196,198,207,0.2)" }}>
        <span className="material-symbols-outlined text-[#d6e3ff] shrink-0">info</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#d6e3ff]">Aviso de Privacidad y Autorización</p>
          <p className="text-xs text-[#d6e3ff] opacity-90 mt-0.5">
            Al gestionar estos perfiles, confirmas que cuentas con la autorización legal o el consentimiento explícito de cada persona para acceder y administrar sus datos médicos.
          </p>
        </div>
      </div>

      {/* Grid de tarjetas */}
      {loading ? (
        <div className="flex justify-center py-20">
          <span className="material-symbols-outlined text-[#002045] text-5xl animate-pulse">group</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {personas.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              age={age(p)}
              onEdit={() => openEdit(p)}
              onDelete={() => !p.isOwner && setConfirmDelete(p)}
            />
          ))}

          {/* Tarjeta "Añadir" */}
          <button
            onClick={openAdd}
            className="bg-white rounded-2xl p-4 border-2 border-dashed border-[#c4c6cf] flex flex-col items-center justify-center gap-3 hover:border-[#13696a] transition-all group"
            style={{ minHeight: 260 }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: "#e5e9eb" }}>
              <span className="material-symbols-outlined text-[#43474e] text-3xl">add</span>
            </div>
            <p className="text-sm font-semibold text-[#002045]">Añadir otro familiar</p>
            <p className="text-xs text-[#43474e] text-center">Hermanos, primos o cuidadores secundarios.</p>
          </button>
        </div>
      )}

      {/* Modal Agregar/Editar */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(45,49,51,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md"
            style={{ boxShadow: "0 24px 48px rgba(0,32,69,0.2)" }}>
            <h3 className="text-xl font-bold text-[#002045] mb-4"
              style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>
              {editing ? "Editar persona" : "Agregar persona"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Nombre completo">
                <input required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. María González"
                  className="w-full px-4 py-2.5 border border-[#c4c6cf] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#13696a] focus:border-[#13696a]" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Parentesco">
                  <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-[#c4c6cf] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#13696a] bg-white">
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Año de nacimiento">
                  <input type="number" required min={1900} max={new Date().getFullYear()}
                    value={form.birthYear}
                    onChange={(e) => setForm(f => ({ ...f, birthYear: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-[#c4c6cf] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#13696a]" />
                </Field>
              </div>
              <Field label="Sexo biológico">
                <select value={form.sex} onChange={(e) => setForm(f => ({ ...f, sex: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-[#c4c6cf] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#13696a] bg-white">
                  {SEXES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Último documento (opcional)">
                <input value={form.lastDocument} onChange={(e) => setForm(f => ({ ...f, lastDocument: e.target.value }))}
                  placeholder="Ej. Análisis de sangre"
                  className="w-full px-4 py-2.5 border border-[#c4c6cf] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#13696a]" />
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 h-11 rounded-full border-2 border-[#13696a] text-[#13696a] font-semibold text-sm hover:bg-[rgba(19,105,106,0.05)] transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 h-11 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                  style={{ backgroundColor: "#002045" }}>
                  {saving ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : (editing ? "Guardar cambios" : "Agregar")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(45,49,51,0.5)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center"
            style={{ boxShadow: "0 24px 48px rgba(0,32,69,0.2)" }}>
            <span className="material-symbols-outlined text-[#ba1a1a] text-5xl mb-3 block">person_remove</span>
            <h3 className="text-lg font-bold text-[#002045] mb-2">¿Eliminar a {confirmDelete.name}?</h3>
            <p className="text-sm text-[#43474e] mb-6">Se eliminarán su perfil y referencias. Los documentos subidos permanecerán.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 h-11 rounded-full border-2 border-[#c4c6cf] text-[#43474e] font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="flex-1 h-11 rounded-full text-white font-semibold text-sm"
                style={{ backgroundColor: "#ba1a1a" }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PersonaCard({ persona: p, age, onEdit, onDelete }: { persona: Persona; age: number; onEdit: () => void; onDelete: () => void }) {
  const avatar = p.photoURL || DEMO_AVATARS[p.name];
  const alertOk = p.alertStatus === "ok";

  return (
    <div className="bg-white rounded-2xl p-4 border border-[rgba(196,198,207,0.1)] flex flex-col group hover:border-[#13696a] transition-all"
      style={{ boxShadow: "0px 4px 20px rgba(26,54,93,0.08)" }}>

      {/* Avatar + acciones */}
      <div className="flex justify-between items-start mb-4">
        <div className="relative">
          {avatar ? (
            <Image src={avatar} alt={p.name} width={64} height={64}
              className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: "#002045" }}>
              {p.name[0]}
            </div>
          )}
          {p.isOwner && (
            <div className="absolute -bottom-1 -right-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#13696a" }}>YO</div>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit}
            className="p-1 text-[#43474e] hover:bg-[#e5e9eb] rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          {!p.isOwner && (
            <button onClick={onDelete}
              className="p-1 text-[#43474e] hover:bg-[#ffdad6] hover:text-[#93000a] rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#002045]"
          style={{ fontFamily: "Atkinson Hyperlegible Next, sans-serif" }}>{p.name}</h3>
        <p className="text-xs text-[#43474e]">{age} años • {p.role}</p>
      </div>

      {/* Metadata */}
      <div className="space-y-2 mb-6 flex-1">
        <div className="flex justify-between text-xs border-b border-[#c4c6cf] pb-2">
          <span className="text-[#43474e]">Último documento</span>
          <span className="font-semibold text-[#002045] truncate ml-2">{p.lastDocument || "—"}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#43474e]">Alertas</span>
          <span className={`flex items-center gap-1 font-bold ${alertOk ? "text-[#13696a]" : "text-[#ba1a1a]"}`}>
            <span className="material-symbols-outlined text-[14px]">{alertOk ? "check_circle" : "warning"}</span>
            {alertOk ? "Al día" : (p.alertLabel || "Pendiente")}
          </span>
        </div>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-2 gap-2">
        <button className="col-span-2 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ backgroundColor: "#ffdad6", color: "#93000a" }}>
          <span className="material-symbols-outlined text-[16px]">emergency_home</span>
          Emergencia
        </button>
        <Link href={`/personas/${p.id}`}
          className="py-2 rounded-lg text-[#002045] text-xs font-semibold hover:bg-[#e5e9eb] transition-colors text-center"
          style={{ backgroundColor: "#f1f4f6" }}>
          Historial
        </Link>
        <button className="py-2 rounded-lg text-[#002045] text-xs font-semibold hover:bg-[#e5e9eb] transition-colors"
          style={{ backgroundColor: "#f1f4f6" }}>
          Permisos
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[#002045] tracking-wide">{label}</label>
      {children}
    </div>
  );
}
