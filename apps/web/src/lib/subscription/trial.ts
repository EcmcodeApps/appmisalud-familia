import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export const TRIAL_DAYS = 30;

export type SubscriptionStatus = "trial" | "trial_expired" | "active" | "past_due" | "cancelled";

export interface TrialInfo {
  status: SubscriptionStatus;
  plan: string;
  startedAt: Date;
  endsAt: Date;
  daysRemaining: number;
  daysUsed: number;
  progress: number;
  isActive: boolean;
  isExpired: boolean;
}

type TimestampLike = Timestamp | Date | string | number | { seconds: number; nanoseconds?: number } | null | undefined;

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatTrialDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function toDate(value: TimestampLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  return null;
}

export function getInitialTrialDates(now = new Date()) {
  return {
    startedAt: now,
    endsAt: addDays(now, TRIAL_DAYS),
  };
}

export function buildTrialFields(now = new Date()) {
  const { endsAt } = getInitialTrialDates(now);
  return {
    trialStartedAt: serverTimestamp(),
    trialEndsAt: Timestamp.fromDate(endsAt),
    subscriptionStatus: "trial" satisfies SubscriptionStatus,
    plan: "free_trial",
  };
}

export function evaluateTrial(data: Record<string, unknown>, now = new Date()): TrialInfo {
  const fallbackStart = toDate(data.createdAt as TimestampLike) ?? now;
  const startedAt = toDate(data.trialStartedAt as TimestampLike) ?? fallbackStart;
  const endsAt = toDate(data.trialEndsAt as TimestampLike) ?? addDays(startedAt, TRIAL_DAYS);
  const rawStatus = data.subscriptionStatus as SubscriptionStatus | undefined;
  const expiredByDate = now.getTime() > endsAt.getTime();
  const status: SubscriptionStatus =
    rawStatus === "active" || rawStatus === "past_due" || rawStatus === "cancelled"
      ? rawStatus
      : expiredByDate
        ? "trial_expired"
        : "trial";
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / msPerDay));
  const daysUsed = Math.min(TRIAL_DAYS, Math.max(0, TRIAL_DAYS - daysRemaining));

  return {
    status,
    plan: (data.plan as string | undefined) ?? "free_trial",
    startedAt,
    endsAt,
    daysRemaining,
    daysUsed,
    progress: Math.min(100, Math.max(0, Math.round((daysUsed / TRIAL_DAYS) * 100))),
    isActive: status === "active" || status === "trial",
    isExpired: status === "trial_expired" || status === "past_due" || status === "cancelled",
  };
}

export async function ensureTrialForUser(uid: string): Promise<TrialInfo> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const data = snap.exists() ? snap.data() : {};
  const patch: Record<string, unknown> = {};

  if (!snap.exists()) {
    Object.assign(patch, { uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
  if (!data.trialStartedAt) patch.trialStartedAt = serverTimestamp();
  if (!data.trialEndsAt) {
    const start = toDate(data.createdAt as TimestampLike) ?? new Date();
    patch.trialEndsAt = Timestamp.fromDate(addDays(start, TRIAL_DAYS));
  }
  if (!data.subscriptionStatus) patch.subscriptionStatus = "trial";
  if (!data.plan) patch.plan = "free_trial";

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = serverTimestamp();
    await setDoc(userRef, patch, { merge: true });
  }

  const merged = { ...data, ...patch };
  const trial = evaluateTrial(merged);

  if (trial.status === "trial_expired" && data.subscriptionStatus !== "trial_expired") {
    await setDoc(userRef, {
      subscriptionStatus: "trial_expired",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  return trial;
}
