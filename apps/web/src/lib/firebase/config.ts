import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// No inicializar si faltan variables (evita crash en dev sin .env.local)
const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp;
if (isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} else {
  // App dummy para que los imports no rompan — las llamadas a auth fallarán con error claro
  if (getApps().length === 0) {
    app = initializeApp({ apiKey: "PLACEHOLDER", projectId: "PLACEHOLDER" });
  } else {
    app = getApps()[0];
  }
  if (typeof window !== "undefined") {
    console.warn("[MiSalud FamilIA] Firebase no configurado. Crea apps/web/.env.local con las variables NEXT_PUBLIC_FIREBASE_*");
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { isConfigured };
export default app;
