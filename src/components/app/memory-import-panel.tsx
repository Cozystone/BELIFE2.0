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
  { value: "note", label: "메모" },
  { value: "journal", label: "저널" },
  { value: "chat", label: "대화" },
  { value: "document", label: "문서" },
  { value: "relationship", label: "관계" },
  { value: "other", label: "기타" },
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
        throw new Error(body.error || "BELIFE 기억을 가져오지 못했습니다.");
      }
      setStatus(
        `기억 ${body.imported?.memoryChunks ?? 0}개와 온톨로지 신호 ${body.imported?.ontologyUpdates ?? 0}개를 반영했습니다. 데이터 신뢰도 ${body.dataTrust?.score ?? "n/a"}.`,
      );
      setTitle("");
      setSourceType("note");
      setContent("");
      setConsent(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "BELIFE 기억을 가져오지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-cyan-500/10 text-cyan-200">
          <FileUp className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-medium">기억 가져오기</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            메모, 저널 조각, 관계 맥락을 명시적 동의와 함께 저장합니다. BELIFE는 원문을 보관하고 조심스럽게 기억 신호를 추출합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="block text-sm">
            <span className="text-zinc-400">제목</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              placeholder="예: 3월 저널 메모"
              className="mt-2 h-10 w-full rounded-md border border-white/[0.1] bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-400">출처</span>
            <select
              value={sourceType}
              onChange={(event) => setSourceType(event.target.value as ImportSourceType)}
              className="mt-2 h-10 w-full rounded-md border border-white/[0.1] bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
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
          <span className="text-zinc-400">내용</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={12000}
            placeholder="BELIFE가 기억해도 되는 메모, 저널 조각, 관계 맥락을 붙여넣어 주세요."
            className="mt-2 min-h-32 w-full resize-none rounded-md border border-white/[0.1] bg-slate-950 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60"
          />
        </label>
        <label className="flex items-start gap-3 rounded-md border border-white/[0.08] bg-slate-950/40 p-3 text-sm leading-6 text-zinc-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4 accent-cyan-400"
          />
          <span>이 내용을 BELIFE 기억에 저장하고 이후 자기 이해에 사용하는 데 동의합니다.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={importMemory} disabled={!canImport}>
            <UploadCloud className="h-4 w-4" />
            기억 가져오기
          </Button>
          {status ? <p className="text-sm text-cyan-200">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
