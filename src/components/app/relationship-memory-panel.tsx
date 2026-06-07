"use client";

import { MessageCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type { RelationshipMemoryKind, RelationshipMemoryReport } from "@/lib/engines/types";
import { ScoreBar } from "./score-bar";

interface RelationshipMemoryResponse {
  ok?: boolean;
  report?: RelationshipMemoryReport;
  extracted?: {
    memoryChunks: number;
    ontologyUpdates: number;
    usedAi: boolean;
  };
  dataTrust?: { score: number };
  error?: string;
}

const relationshipTypes: Array<{ value: RelationshipMemoryKind; label: string }> = [
  { value: "friendship", label: "Friendship" },
  { value: "collaboration", label: "Collaboration" },
  { value: "mentorship", label: "Mentorship" },
  { value: "family", label: "Family" },
  { value: "romantic", label: "Romantic" },
  { value: "other", label: "Other" },
];

export function RelationshipMemoryPanel({ initialReport }: { initialReport: RelationshipMemoryReport }) {
  const router = useRouter();
  const [personLabel, setPersonLabel] = useState("");
  const [relationshipType, setRelationshipType] = useState<RelationshipMemoryKind>("friendship");
  const [interactionNote, setInteractionNote] = useState("");
  const [interactionQuality, setInteractionQuality] = useState(0.55);
  const [emotionalSafety, setEmotionalSafety] = useState(0.55);
  const [reciprocity, setReciprocity] = useState(0.55);
  const [repairAttempted, setRepairAttempted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const canSave = personLabel.trim().length > 0 && interactionNote.trim().length >= 20 && consent && !saving;

  async function saveMemory() {
    if (!canSave) return;
    setSaving(true);
    setStatus("");
    try {
      const response = await belifeFetch("/api/connection/relationship-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personLabel,
          relationshipType,
          interactionNote,
          interactionQuality,
          emotionalSafety,
          reciprocity,
          repairAttempted,
          consent,
        }),
      });
      const body = (await response.json()) as RelationshipMemoryResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to save relationship memory.");
      }
      setStatus(
        `Saved ${body.extracted?.memoryChunks ?? 1} relationship memory signals. Data trust ${body.dataTrust?.score ?? "n/a"}.`,
      );
      setPersonLabel("");
      setInteractionNote("");
      setInteractionQuality(0.55);
      setEmotionalSafety(0.55);
      setReciprocity(0.55);
      setRepairAttempted(false);
      setConsent(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save relationship memory.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">Relationship Memory</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Store private pairwise interaction notes with consent. BELIFE uses them to summarize safety, reciprocity, and repair patterns without public matching.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-md border border-white/[0.08] bg-black/35 p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px] lg:grid-cols-1">
            <label className="block text-sm">
              <span className="text-zinc-400">Person or context</span>
              <input
                value={personLabel}
                onChange={(event) => setPersonLabel(event.target.value)}
                maxLength={80}
                placeholder="Example: Alex, design partner, older sibling"
                className="mt-2 h-10 w-full rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-400">Relationship type</span>
              <select
                value={relationshipType}
                onChange={(event) => setRelationshipType(event.target.value as RelationshipMemoryKind)}
                className="mt-2 h-10 w-full rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition focus:border-orange-400/60"
              >
                {relationshipTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 block text-sm">
            <span className="text-zinc-400">Interaction note</span>
            <textarea
              value={interactionNote}
              onChange={(event) => setInteractionNote(event.target.value)}
              maxLength={4000}
              placeholder="What happened, how it felt, what helped, and what felt risky?"
              className="mt-2 min-h-32 w-full resize-none rounded-md border border-white/[0.1] bg-black p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
            />
          </label>
          <div className="mt-4 grid gap-3">
            <Slider label="Interaction quality" value={interactionQuality} onChange={setInteractionQuality} />
            <Slider label="Emotional safety" value={emotionalSafety} onChange={setEmotionalSafety} />
            <Slider label="Reciprocity" value={reciprocity} onChange={setReciprocity} />
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-md border border-white/[0.08] bg-black/40 p-3 text-sm leading-6 text-zinc-400">
            <input
              type="checkbox"
              checked={repairAttempted}
              onChange={(event) => setRepairAttempted(event.target.checked)}
              className="mt-1 h-4 w-4 accent-orange-400"
            />
            <span>A repair attempt, clarification, or mutual reset was visible.</span>
          </label>
          <label className="mt-3 flex items-start gap-3 rounded-md border border-white/[0.08] bg-black/40 p-3 text-sm leading-6 text-zinc-400">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="mt-1 h-4 w-4 accent-orange-400"
            />
            <span>I confirm this relationship note should be stored in BELIFE private memory.</span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={saveMemory} disabled={!canSave}>
              <Save className="h-4 w-4" />
              Save relationship memory
            </Button>
            {status ? <p className="text-sm text-orange-200">{status}</p> : null}
          </div>
        </div>

        <div className="space-y-3">
          {initialReport.pairs.length ? (
            initialReport.pairs.map((pair) => (
              <article key={pair.pairKey} className="rounded-md border border-white/[0.08] bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-zinc-100">{pair.personLabel}</h3>
                      <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-zinc-300">
                        {pair.relationshipType}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{pair.summary}</p>
                  </div>
                  <span className="rounded-md bg-orange-500/10 px-2 py-1 font-mono text-xs text-orange-200">
                    {pair.riskLevel}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ScoreBar label="Safety" value={pair.emotionalSafety} tone="teal" />
                  <ScoreBar label="Reciprocity" value={pair.reciprocity} />
                  <ScoreBar label="Repair" value={pair.repairEvidence} tone="zinc" />
                </div>
                <p className="mt-4 rounded-md border border-white/[0.08] bg-black/30 p-3 text-sm leading-6 text-zinc-400">
                  {pair.nextObservation}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-md border border-white/[0.08] bg-black/30 p-4 text-sm leading-6 text-zinc-500">
              No pairwise relationship memory yet. Add one real interaction to start a private relationship summary.
            </div>
          )}
          <p className="rounded-md border border-white/[0.08] bg-black/30 p-3 text-xs leading-5 text-zinc-500">
            {initialReport.guardrail}
          </p>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className="font-mono text-xs text-orange-200">{Math.round(value * 100)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-orange-400"
      />
    </label>
  );
}
