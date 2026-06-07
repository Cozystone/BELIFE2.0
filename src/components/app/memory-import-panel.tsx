"use client";

import { FileUp, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";

type ImportSourceType = "note" | "journal" | "chat" | "document" | "relationship" | "other";

interface ImportResponse {
  ok?: boolean;
  imported?: {
    memoryChunks: number;
    ontologyUpdates: number;
    usedAi: boolean;
  };
  dataTrust?: { score: number };
  error?: string;
}

const sourceTypes: Array<{ value: ImportSourceType; label: string }> = [
  { value: "note", label: "Note" },
  { value: "journal", label: "Journal" },
  { value: "chat", label: "Chat" },
  { value: "document", label: "Document" },
  { value: "relationship", label: "Relationship" },
  { value: "other", label: "Other" },
];

export function MemoryImportPanel() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<ImportSourceType>("note");
  const [content, setContent] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const canImport = title.trim().length > 0 && content.trim().length >= 20 && consent && !saving;

  async function importMemory() {
    if (!canImport) return;
    setSaving(true);
    setStatus("");
    try {
      const response = await belifeFetch("/api/memory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceType, content, consent }),
      });
      const body = (await response.json()) as ImportResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to import BELIFE memory.");
      }
      setStatus(
        `Imported ${body.imported?.memoryChunks ?? 0} memory chunks and ${body.imported?.ontologyUpdates ?? 0} ontology signals. Data trust ${body.dataTrust?.score ?? "n/a"}.`,
      );
      setTitle("");
      setSourceType("note");
      setContent("");
      setConsent(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to import BELIFE memory.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-orange-500/10 text-orange-200">
          <FileUp className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-medium">Memory Import</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Add notes, journal fragments, or relationship context with explicit consent. BELIFE stores the original import and extracts cautious memory signals.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="block text-sm">
            <span className="text-zinc-400">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              placeholder="Example: March journal note"
              className="mt-2 h-10 w-full rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">Source</span>
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as ImportSourceType)}
              className="mt-2 h-10 w-full rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition focus:border-orange-400/60"
            >
              {sourceTypes.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-zinc-400">Content</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={12000}
            placeholder="Paste a note, journal fragment, or relationship context that BELIFE can remember."
            className="mt-2 min-h-32 w-full resize-none rounded-md border border-white/[0.1] bg-black p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
          />
        </label>
        <label className="flex items-start gap-3 rounded-md border border-white/[0.08] bg-black/40 p-3 text-sm leading-6 text-zinc-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4 accent-orange-400"
          />
          <span>I confirm this import should be stored in BELIFE memory and used for future self-understanding.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={importMemory} disabled={!canImport}>
            <UploadCloud className="h-4 w-4" />
            Import memory
          </Button>
          {status ? <p className="text-sm text-orange-200">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
