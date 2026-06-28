import type {
  DealershipOnboardingIntakePayload,
  DealershipOnboardingUnitDraft,
} from "@autopainel/shared/types";

const STORAGE_KEY = "ap-trial-onboarding-draft-v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface TrialOnboardingDraft {
  payload: DealershipOnboardingIntakePayload;
  units: DealershipOnboardingUnitDraft[];
  step: number;
  trialAccepted: boolean;
  platformTermsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
  savedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTrialOnboardingDraft(value: unknown): value is TrialOnboardingDraft {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.payload) &&
    Array.isArray(value.units) &&
    typeof value.step === "number" &&
    typeof value.trialAccepted === "boolean" &&
    typeof value.platformTermsAccepted === "boolean" &&
    typeof value.privacyAccepted === "boolean" &&
    typeof value.marketingConsent === "boolean" &&
    typeof value.savedAt === "string"
  );
}

export function loadTrialOnboardingDraft(): TrialOnboardingDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isTrialOnboardingDraft(parsed)) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const savedAtMs = Date.parse(parsed.savedAt);
    if (Number.isNaN(savedAtMs) || Date.now() - savedAtMs > MAX_AGE_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveTrialOnboardingDraft(draft: Omit<TrialOnboardingDraft, "savedAt">): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: TrialOnboardingDraft = {
      ...draft,
      savedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export function clearTrialOnboardingDraft(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
