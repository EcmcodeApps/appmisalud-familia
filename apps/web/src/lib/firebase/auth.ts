import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { buildTrialFields } from "@/lib/subscription/trial";

const googleProvider = new GoogleAuthProvider();

export interface GoogleLoginResult {
  user: User;
  onboardingCompleted: boolean;
}

export async function loginWithGoogle(): Promise<GoogleLoginResult> {
  const { user } = await signInWithPopup(auth, googleProvider);

  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        user,
        onboardingCompleted: Boolean(data.onboardingCompleted ?? data.onboarding_completed),
      };
    }

    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? "",
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      onboardingCompleted: false,
      onboarding_completed: false,
      ...buildTrialFields(),
      role: "user",
      accountStatus: "active",
      consent: {
        medicalDataProcessing: false,
        caregiverResponsibility: false,
        aiAnalysis: false,
        consentVersion: "1.0",
        acceptedAt: null,
      },
      settings: {
        language: "es",
        remindersEnabled: false,
        aiEnabled: false,
        darkMode: false,
        mobilePrintHintsEnabled: true,
      },
    });
  } catch (error) {
    console.warn("[AppMiSalud] Google Auth completó, pero no se pudo sincronizar el perfil.", error);
  }

  return { user, onboardingCompleted: false };
}

export async function registerUser(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    onboardingCompleted: false,
    onboarding_completed: false,
    ...buildTrialFields(),
    role: "user",
    accountStatus: "active",
    consent: {
      medicalDataProcessing: false,
      caregiverResponsibility: false,
      aiAnalysis: false,
      consentVersion: "1.0",
      acceptedAt: null,
    },
    settings: {
      language: "es",
      remindersEnabled: false,
      aiEnabled: false,
      darkMode: false,
      mobilePrintHintsEnabled: true,
    },
  });
  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
