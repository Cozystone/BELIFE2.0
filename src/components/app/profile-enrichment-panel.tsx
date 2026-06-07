"use client";

import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type { ProfileEnrichmentSuggestion } from "@/lib/engines/types";

export function ProfileEnrichmentPanel({
  initialSuggestions,
}: {
  initialSuggestions: ProfileEnrichmentSuggestion[];
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  async function accept(id: string) {
    setSavingId(id);
    setStatus("");
    try {
      const response = await belifeFetch("/api/profile/enrichment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setSuggestions((current) => current.filter((suggestion) => suggestion.id !== id));
        setStatus("BELIFE에 반영했습니다.");
      } else {
        const body = (await response.json()) as { error?: string };
        setStatus(body.error || "반영하지 못했습니다.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "반영하지 못했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-orange-300" />
        <h2 className="font-medium">Profile Enrichment</h2>
      </div>
      <div className="mt-4 space-y-3">
        {suggestions.length ? (
          suggestions.map((suggestion) => (
            <article key={suggestion.id} className="rounded-md border border-white/[0.08] bg-black/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{suggestion.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{suggestion.question}</p>
                </div>
                <span className="font-mono text-xs text-orange-200">{Math.round(suggestion.confidence * 100)}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{suggestion.detail}</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => accept(suggestion.id)}
                disabled={savingId === suggestion.id}
              >
                <Check className="h-3.5 w-3.5" />
                Add to BELIFE
              </Button>
            </article>
          ))
        ) : (
          <div className="rounded-md border border-white/[0.08] bg-black/40 p-3 text-sm leading-6 text-zinc-500">
            대화를 조금 더 나누면 승인 가능한 자기 신호가 여기에 나타납니다.
          </div>
        )}
      </div>
      {status ? <p className="mt-3 text-sm text-orange-200">{status}</p> : null}
    </section>
  );
}
