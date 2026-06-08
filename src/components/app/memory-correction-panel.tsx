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
        throw new Error(body.error || "기억 정정을 저장하지 못했습니다.");
      }
      setStatus(
        `정정을 저장했습니다. 온톨로지 신호 ${body.ontologyUpdates?.length ?? 0}개가 갱신되었습니다. 데이터 신뢰도 ${body.dataTrust?.score ?? "n/a"}.`,
      );
      setTarget("");
      setCorrection("");
      setConsent(false);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "기억 정정을 저장하지 못했습니다.");
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
          <h2 className="font-medium">기억 정정</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            BELIFE가 잘못 이해한 부분을 알려주세요. 정정 내용은 사용자가 확인한 명시 기억으로 저장됩니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block text-sm">
          <span className="text-zinc-400">다시 봐야 할 기억</span>
          <input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            maxLength={320}
            placeholder="선택: 패턴, 기억, 관계 신호"
            className="mt-2 h-10 w-full rounded-md border border-white/[0.1] bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-300/60"
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-400">정정 내용</span>
          <textarea
            value={correction}
            onChange={(event) => setCorrection(event.target.value)}
            maxLength={1600}
            placeholder="실제로 BELIFE가 기억해야 할 것은..."
            className="mt-2 min-h-28 w-full resize-none rounded-md border border-white/[0.1] bg-slate-950 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-teal-300/60"
          />
        </label>
        <label className="flex items-start gap-3 rounded-md border border-white/[0.08] bg-slate-950/40 p-3 text-sm leading-6 text-zinc-400">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4 accent-teal-300"
          />
          <span>이 정정을 BELIFE 기억에 저장하고 이후 해석 조정에 사용하는 데 동의합니다.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="secondary" onClick={saveCorrection} disabled={!canSave}>
            <CheckCircle2 className="h-4 w-4" />
            정정 저장
          </Button>
          {status ? <p className="text-sm text-cyan-200">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
