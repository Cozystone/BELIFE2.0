"use client";

import { Download, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";

export function DataControlsPanel() {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [resetting, setResetting] = useState(false);
  const canReset = confirmation === "RESET";

  async function resetMemory() {
    if (!canReset || resetting) return;
    setResetting(true);
    setStatus("");
    try {
      const response = await belifeFetch("/api/memory/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setStatus(body.error || "초기화하지 못했습니다.");
        return;
      }
      setStatus("BELIFE 기억을 초기화했습니다.");
      setConfirmation("");
      router.push("/onboarding");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "초기화하지 못했습니다.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <h2 className="font-medium">Data Controls</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <a
          href="/api/memory/export"
          className="flex min-h-24 items-start gap-3 rounded-md border border-teal-300/15 bg-teal-400/5 p-3 text-left transition hover:border-teal-200/30"
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
            <Download className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-sm font-medium text-zinc-100">Export BELIFE data</span>
            <span className="mt-2 block text-sm leading-6 text-zinc-500">
              프로필, 대화, 기억 조각, 온톨로지, 상태 추정, 관계 프리뷰를 JSON으로 내려받습니다.
            </span>
          </span>
        </a>

        <div className="rounded-md border border-orange-300/15 bg-orange-500/5 p-3">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-orange-500/10 text-orange-200">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-100">Reset BELIFE memory</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                계정은 유지하고 BELIFE가 쌓은 앱 데이터와 해석 구조를 초기화합니다.
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="RESET 입력"
              className="h-10 rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
            />
            <Button type="button" variant="danger" onClick={resetMemory} disabled={!canReset || resetting}>
              Reset
            </Button>
          </div>
          {status ? <p className="mt-3 text-sm text-orange-200">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
