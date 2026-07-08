export type PlanId = "free_trial" | "economico" | "familiar" | "premium";

export interface PlanDefinition {
  id: PlanId;
  label: string;
  priceLabel: string;
  maxDocuments: number;
  maxStorageBytes: number;
  maxAiTokensMonth: number;
  maxAiRequestsMonth: number;
  description: string;
}

export interface UsageCounters {
  documentCount: number;
  storageBytesUsed: number;
  aiTokensUsedMonth: number;
  aiRequestsMonth: number;
}

export interface PlanLimits {
  maxDocuments: number;
  maxStorageBytes: number;
  maxAiTokensMonth: number;
  maxAiRequestsMonth: number;
}

export interface UploadAllowance {
  allowed: boolean;
  level: "ok" | "warning" | "blocked";
  title: string;
  message: string;
  documentPercentAfter: number;
  storagePercentAfter: number;
  aiRequestsPercentAfter: number;
}

const GB = 1024 * 1024 * 1024;

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free_trial: {
    id: "free_trial",
    label: "Prueba gratuita",
    priceLabel: "$0 por 30 dias",
    maxDocuments: 30,
    maxStorageBytes: 1 * GB,
    maxAiTokensMonth: 20_000,
    maxAiRequestsMonth: 30,
    description: "Ideal para probar la boveda familiar durante el primer mes.",
  },
  economico: {
    id: "economico",
    label: "Economico",
    priceLabel: "Plan economico",
    maxDocuments: 100,
    maxStorageBytes: 1 * GB,
    maxAiTokensMonth: 100_000,
    maxAiRequestsMonth: 120,
    description: "Para familias que necesitan una boveda simple y controlada.",
  },
  familiar: {
    id: "familiar",
    label: "Familiar",
    priceLabel: "Plan familiar",
    maxDocuments: 300,
    maxStorageBytes: 5 * GB,
    maxAiTokensMonth: 350_000,
    maxAiRequestsMonth: 400,
    description: "Para hogares con varios integrantes y uso frecuente de IA.",
  },
  premium: {
    id: "premium",
    label: "Premium",
    priceLabel: "Plan premium",
    maxDocuments: 1000,
    maxStorageBytes: 10 * GB,
    maxAiTokensMonth: 1_000_000,
    maxAiRequestsMonth: 1200,
    description: "Para uso intensivo, archivo historico amplio y mas IA mensual.",
  },
};

export const DEFAULT_USAGE: UsageCounters = {
  documentCount: 0,
  storageBytesUsed: 0,
  aiTokensUsedMonth: 0,
  aiRequestsMonth: 0,
};

export function normalizePlanId(plan: unknown): PlanId {
  return typeof plan === "string" && plan in PLAN_DEFINITIONS ? (plan as PlanId) : "free_trial";
}

export function getPlanDefinition(plan: unknown): PlanDefinition {
  return PLAN_DEFINITIONS[normalizePlanId(plan)];
}

export function getPlanLimits(plan: unknown): PlanLimits {
  const definition = getPlanDefinition(plan);
  return {
    maxDocuments: definition.maxDocuments,
    maxStorageBytes: definition.maxStorageBytes,
    maxAiTokensMonth: definition.maxAiTokensMonth,
    maxAiRequestsMonth: definition.maxAiRequestsMonth,
  };
}

export function buildPlanLimitFields(plan: unknown) {
  return {
    limits: getPlanLimits(plan),
  };
}

export function normalizeUsage(value: unknown): UsageCounters {
  const usage = value && typeof value === "object" ? (value as Partial<UsageCounters>) : {};
  return {
    documentCount: Number(usage.documentCount ?? 0),
    storageBytesUsed: Number(usage.storageBytesUsed ?? 0),
    aiTokensUsedMonth: Number(usage.aiTokensUsedMonth ?? 0),
    aiRequestsMonth: Number(usage.aiRequestsMonth ?? 0),
  };
}

export function usagePercent(used: number, limit: number): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${Math.max(0.1, mb).toFixed(mb < 10 ? 1 : 0)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(gb < 10 ? 1 : 0)} GB`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

export function evaluateUploadAllowance(params: {
  plan: unknown;
  usage: UsageCounters;
  fileSizeBytes: number;
  aiProcess: boolean;
  subscriptionStatus?: string;
}): UploadAllowance {
  const plan = getPlanDefinition(params.plan);
  const documentCountAfter = params.usage.documentCount + 1;
  const storageBytesAfter = params.usage.storageBytesUsed + params.fileSizeBytes;
  const aiRequestsAfter = params.usage.aiRequestsMonth + (params.aiProcess ? 1 : 0);
  const documentPercentAfter = usagePercent(documentCountAfter, plan.maxDocuments);
  const storagePercentAfter = usagePercent(storageBytesAfter, plan.maxStorageBytes);
  const aiRequestsPercentAfter = usagePercent(aiRequestsAfter, plan.maxAiRequestsMonth);

  if (params.subscriptionStatus === "trial_expired" && plan.id === "free_trial") {
    return {
      allowed: false,
      level: "blocked",
      title: "Prueba gratuita finalizada",
      message: "Para seguir subiendo documentos, activa un plan economico, familiar o premium.",
      documentPercentAfter,
      storagePercentAfter,
      aiRequestsPercentAfter,
    };
  }

  if (documentCountAfter > plan.maxDocuments) {
    return {
      allowed: false,
      level: "blocked",
      title: "Limite de documentos alcanzado",
      message: `Tu plan ${plan.label} permite hasta ${formatNumber(plan.maxDocuments)} documentos.`,
      documentPercentAfter,
      storagePercentAfter,
      aiRequestsPercentAfter,
    };
  }

  if (storageBytesAfter > plan.maxStorageBytes) {
    return {
      allowed: false,
      level: "blocked",
      title: "Limite de almacenamiento alcanzado",
      message: `Este archivo supera el espacio disponible. Te quedan ${formatBytes(Math.max(0, plan.maxStorageBytes - params.usage.storageBytesUsed))}.`,
      documentPercentAfter,
      storagePercentAfter,
      aiRequestsPercentAfter,
    };
  }

  if (params.aiProcess && aiRequestsAfter > plan.maxAiRequestsMonth) {
    return {
      allowed: false,
      level: "blocked",
      title: "Limite mensual de IA alcanzado",
      message: "Puedes subir el documento desactivando el procesamiento con IA, o cambiar a un plan superior.",
      documentPercentAfter,
      storagePercentAfter,
      aiRequestsPercentAfter,
    };
  }

  const remainingStorage = plan.maxStorageBytes - storageBytesAfter;
  const nearLimit = documentPercentAfter >= 85 || storagePercentAfter >= 85 || aiRequestsPercentAfter >= 85;

  if (nearLimit) {
    return {
      allowed: true,
      level: "warning",
      title: "Estas cerca del limite de tu plan",
      message: `La carga se permite, pero despues quedaran ${formatBytes(remainingStorage)} disponibles.`,
      documentPercentAfter,
      storagePercentAfter,
      aiRequestsPercentAfter,
    };
  }

  return {
    allowed: true,
    level: "ok",
    title: "Carga permitida",
    message: `Despues de subir este archivo quedaran ${formatBytes(remainingStorage)} disponibles.`,
    documentPercentAfter,
    storagePercentAfter,
    aiRequestsPercentAfter,
  };
}
