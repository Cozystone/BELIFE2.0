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
        throw new Error(body.error || "프라이버시 설정을 저장하지 못했습니다.");
      }
      setPreferences(body.preferences);
      setStatus("프라이버시 설정을 저장했습니다.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "프라이버시 설정을 저장하지 못했습니다.");
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
          <h2 className="font-medium">프라이버시 설정</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            BELIFE의 개인 해석이 상세 근거를 보여줄지, 비공개 관계 프리뷰를 유지할지 직접 정합니다.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex min-h-28 cursor-pointer items-start gap-3 rounded-md border border-white/[0.08] bg-slate-950/40 p-3 transition hover:border-teal-300/25">
          <input
            type="checkbox"
            checked={preferences.showEvidenceLedger}
            onChange={(event) => setPreference("showEvidenceLedger", event.target.checked)}
            className="mt-1 h-4 w-4 accent-teal-300"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
              <Eye className="h-4 w-4 text-teal-200" />
              근거 기록
            </span>
            <span className="mt-2 block text-sm leading-6 text-zinc-500">
              오늘의 해석 뒤에 있는 기억, 메시지, 온톨로지 근거를 보여줍니다.
            </span>
          </span>
        </label>

        <label className="flex min-h-28 cursor-pointer items-start gap-3 rounded-md border border-white/[0.08] bg-slate-950/40 p-3 transition hover:border-cyan-300/25">
          <input
            type="checkbox"
            checked={preferences.connectionPreviewEnabled}
            onChange={(event) => setPreference("connectionPreviewEnabled", event.target.checked)}
            className="mt-1 h-4 w-4 accent-cyan-300"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-100">
              <Network className="h-4 w-4 text-cyan-200" />
              비공개 연결 그래프
            </span>
            <span className="mt-2 block text-sm leading-6 text-zinc-500">
              BELIFE가 개인용 관계 적합도 프리뷰를 만들고 저장할 수 있게 합니다.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" onClick={savePreferences} disabled={saving}>
          설정 저장
        </Button>
        {status ? <p className="text-sm text-teal-200">{status}</p> : null}
      </div>
    </section>
  );
}
