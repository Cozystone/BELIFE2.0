"use client";

import { Eye, Network, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type { PrivacyPreferences } from "@/lib/engines/types";

export function PrivacyPreferencesPanel({ initialPreferences }: { initialPreferences: PrivacyPreferences }) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  function setPreference(key: keyof PrivacyPreferences, value: boolean) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  async function savePreferences() {
    setSaving(true);
    setStatus("");
    try {
      const response = await belifeFetch("/api/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      const body = (await response.json()) as { preferences?: PrivacyPreferences; error?: string };
      if (!response.ok || !body.preferences) {
        throw new Error(body.error || "Unable to update privacy preferences.");
      }
      setPreferences(body.preferences);
      setStatus("Privacy preferences saved.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to update privacy preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-medium">Privacy Preferences</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Control which private BELIFE interpretations can expose detailed evidence or maintain hidden relationship previews.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex min-h-28 cursor-pointer items-start gap-3 rounded-md border border-white/[0.08] bg-black/40 p-3 transition hover:border-teal-300/25">
          <input
            type="checkbox"
            checked={preferences.showEvidenceLedger}
            onChange={(event) => setPreference("showEvidenceLedger", event.target.checked)}
            className="mt-1 h-4 w-4 accent-teal-300"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
              <Eye className="h-4 w-4 text-teal-200" />
              Evidence ledger
            </span>
            <span className="mt-2 block text-sm leading-6 text-zinc-500">
              Show retrieved memory, message, and ontology evidence behind Today interpretations.
            </span>
          </span>
        </label>

        <label className="flex min-h-28 cursor-pointer items-start gap-3 rounded-md border border-white/[0.08] bg-black/40 p-3 transition hover:border-orange-300/25">
          <input
            type="checkbox"
            checked={preferences.connectionPreviewEnabled}
            onChange={(event) => setPreference("connectionPreviewEnabled", event.target.checked)}
            className="mt-1 h-4 w-4 accent-orange-300"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
              <Network className="h-4 w-4 text-orange-200" />
              Hidden connection graph
            </span>
            <span className="mt-2 block text-sm leading-6 text-zinc-500">
              Allow BELIFE to generate and store private relationship-fit previews.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" onClick={savePreferences} disabled={saving}>
          Save preferences
        </Button>
        {status ? <p className="text-sm text-teal-200">{status}</p> : null}
      </div>
    </section>
  );
}
