import type { PrivacyPreferences, UserProfile } from "./types";

export const privacyPreferencesStorageKey = "__belife_privacy_preferences_v1";

export const defaultPrivacyPreferences: PrivacyPreferences = {
  showEvidenceLedger: true,
  connectionPreviewEnabled: true,
};

export function normalizePrivacyPreferences(input: Partial<PrivacyPreferences> = {}): PrivacyPreferences {
  return {
    showEvidenceLedger: input.showEvidenceLedger ?? defaultPrivacyPreferences.showEvidenceLedger,
    connectionPreviewEnabled: input.connectionPreviewEnabled ?? defaultPrivacyPreferences.connectionPreviewEnabled,
  };
}

export function readPrivacyPreferences(profile: UserProfile | null | undefined): PrivacyPreferences {
  const raw = profile?.onboardingAnswers?.[privacyPreferencesStorageKey];
  if (!raw) return defaultPrivacyPreferences;

  try {
    const parsed = JSON.parse(raw) as Partial<PrivacyPreferences>;
    return normalizePrivacyPreferences(parsed);
  } catch {
    return defaultPrivacyPreferences;
  }
}

export function serializePrivacyPreferences(preferences: PrivacyPreferences) {
  return JSON.stringify(normalizePrivacyPreferences(preferences));
}
