import { describe, expect, it } from "vitest";
import {
  defaultPrivacyPreferences,
  privacyPreferencesStorageKey,
  readPrivacyPreferences,
  serializePrivacyPreferences,
} from "@/lib/engines/privacy";
import type { UserProfile } from "@/lib/engines/types";

function profile(raw?: string): UserProfile {
  return {
    userId: "user-1",
    displayName: "User",
    nickname: "User",
    role: "",
    mainWorry: "",
    currentGoal: "",
    importantValue: "",
    stressReaction: "",
    emotionalClimate: "",
    preferredTone: "calm",
    onboardingAnswers: raw ? { [privacyPreferencesStorageKey]: raw } : {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("privacy preferences", () => {
  it("defaults to visible evidence and enabled hidden connection previews", () => {
    expect(readPrivacyPreferences(profile())).toEqual(defaultPrivacyPreferences);
  });

  it("round trips persisted preferences from profile metadata", () => {
    const serialized = serializePrivacyPreferences({
      showEvidenceLedger: false,
      connectionPreviewEnabled: false,
    });

    expect(readPrivacyPreferences(profile(serialized))).toEqual({
      showEvidenceLedger: false,
      connectionPreviewEnabled: false,
    });
  });

  it("falls back when metadata is malformed", () => {
    expect(readPrivacyPreferences(profile("{broken"))).toEqual(defaultPrivacyPreferences);
  });
});
