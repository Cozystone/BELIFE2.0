"use client";

import { CheckCircle2, PencilLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";

interface CorrectionResponse {
  ok?: boolean;
  ontologyUpdates?: unknown[];
  dataTrust?: { score: number };
  error?: string;
}

export function MemoryCorrectionPanel() {
  const router = useRouter();
  const [target, setTarget] = useState("");
  const [correction, setCorrection] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const canSave = correction.trim().length >= 8 && consent && !saving;

  async function saveCorrection() {
    if (!canSave) return;
    setSaving(true);
    setStatus("");
    try {
      const response = await belifeFetch("/api/memory/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, correction, consent }),
      });
      const body = (await response.json()) as CorrectionResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to save memory correction.");
      }
      setStatus(
        `Correction saved. ${body.ontologyUpdates?.length ?? 0} ontology signals updated. Data trust ${body.dataTrust?.score ?? "n/a"}.`,
      );
      setTarget("");
      setCorrection("");
      setConsent(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save memory correction.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
          <PencilLine className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-medium">Memory Correction</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Tell BELIFE what it misunderstood. Corrections are stored as explicit user-confirmed memory.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block text-sm">
          <span className="text-zinc-400">What should BELIFE revisit?</span>
          <input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            maxLength={320}
            placeholder="Optional: a pattern, memory, or relationship signal"
            className="mt-2 h-10 w-full rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-300/60"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">Correction</span>
          <textarea
            value={correction}
            onChange={(event) => setCorrection(event.target.value)}
            maxLength={1600}
            placeholder="Actually, BELIFE should remember that..."
            className="mt-2 min-h-28 w-full resize-none rounded-md border border-white/[0.1] bg-black p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-300/60"
          />
        </label>
        <label className="flex items-start gap-3 rounded-md border border-white/[0.08] bg-black/40 p-3 text-sm leading-6 text-zinc-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4 accent-teal-300"
          />
          <span>I confirm this correction should be saved into BELIFE memory and used to adjust future interpretations.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={saveCorrection} disabled={!canSave}>
            <CheckCircle2 className="h-4 w-4" />
            Save correction
          </Button>
          {status ? <p className="text-sm text-orange-200">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
