export type AccountStatus = "active" | "disabled" | "pending_review";
export type SubscriptionStatus = "trial" | "trial_expired" | "active" | "past_due" | "cancelled";
export type Relationship =
  | "yo" | "padre" | "madre" | "hijo" | "hija" | "conyuge"
  | "adulto_mayor" | "persona_discapacidad" | "cuidador" | "otro";
export type BiologicalSex = "femenino" | "masculino" | "otro" | "prefiero_no_decir";
export type DocumentCategory =
  | "laboratorio" | "historia_clinica" | "formula_medica" | "orden_medica"
  | "autorizacion_eps" | "imagenologia" | "vacunas" | "incapacidad"
  | "cirugia" | "hospitalizacion" | "terapia" | "otro";
export type DocumentStatus =
  | "uploaded" | "security_check" | "processing" | "needs_review"
  | "processed" | "failed" | "archived";
export type FileType = "pdf" | "jpg" | "jpeg" | "png";
export type SummaryType = "doctor" | "emergency" | "custom";
export type SharePermission = "view" | "download";
export type AIProvider = "deepseek" | "openai" | "grok" | "mock";

export interface UserConsent {
  medicalDataProcessing: boolean;
  caregiverResponsibility: boolean;
  aiAnalysis: boolean;
  consentVersion: string;
  acceptedAt: Date | null;
  ipHash?: string;
}

export interface UserSettings {
  language: "es";
  remindersEnabled: boolean;
  aiEnabled: boolean;
  darkMode: boolean;
  mobilePrintHintsEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted: boolean;
  role: "user" | "admin" | "owner";
  accountStatus: AccountStatus;
  subscriptionStatus: SubscriptionStatus;
  plan: "free_trial" | "economico" | "familiar" | string;
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  consent: UserConsent;
  settings: UserSettings;
}

export interface Person {
  personId: string;
  ownerUid: string;
  fullName: string;
  relationship: Relationship;
  birthDate?: string;
  ageApprox?: number;
  biologicalSex?: BiologicalSex;
  epsOrInsurance?: string;
  bloodType?: string;
  allergies?: string[];
  knownConditions?: string[];
  currentMedications?: string[];
  primaryDoctor?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  disabilityNotes?: string;
  caregiverNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
}

export interface MedicalDocument {
  documentId: string;
  ownerUid: string;
  personId: string;
  title: string;
  category: DocumentCategory;
  documentDate: string;
  institution?: string;
  doctor?: string;
  specialty?: string;
  filePath: string;
  fileName: string;
  fileType: FileType;
  fileSizeBytes: number;
  status: DocumentStatus;
  aiClassifiedCategory?: string;
  extractedTextPreview?: string;
  aiSummary?: string;
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LabResult {
  resultId: string;
  documentId: string;
  personId: string;
  indicatorName: string;
  normalizedIndicatorKey: string;
  value: number | string;
  numericValue?: number;
  unit?: string;
  referenceMin?: number;
  referenceMax?: number;
  referenceText?: string;
  status: "within_range" | "low" | "high" | "review" | "unknown";
  rawText?: string;
  confidence?: number;
  reviewedByUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}
