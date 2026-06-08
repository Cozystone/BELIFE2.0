"use client";

import { Brain, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type { TwinReflection } from "@/lib/engines/types";

export function TwinConsole() {
  const [question, setQuestion] = useState("지금 내가 왜 같은 문제를 반복하는지 알려줘.");
  const [reflection, setReflection] = useState<TwinReflection | null>(null);
  const [loading, setLoading] = useState(false);

  async function askTwin() {
    if (!question.trim() || loading) return;
    setLoading(true);
    try {
      const response = await belifeFetch("/api/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const body = (await response.json()) as { answer?: string; reflection?: TwinReflection; error?: string };
      setReflection(
        body.reflection ?? {
          answer: body.answer || body.error || "응답을 만들지 못했습니다.",
          confidence: 0,
          confidenceLabel: "early",
          trustGate: {
            score: 0,
            label: "low",
            ceiling: 0.34,
            note: "데이터 신뢰도가 낮아 트윈 신뢰도를 초기 단계로 제한합니다.",
          },
          evidence: [],
          uncertainties: ["응답 구조화에 실패했습니다."],
          nextQuestion: "다시 묻고 싶은 핵심 질문은 무엇인가요?",
          guardrail: "BELIFE 트윈은 근거가 있는 자기 구조만 반영합니다.",
        },
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-white/[0.08] bg-slate-950/70 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/12 text-teal-200">
          <Brain className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">디지털 트윈</h1>
          <p className="text-sm text-zinc-500">근거 기반으로만 반응하는 제한된 자기 모델</p>
        </div>
      </div>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={4}
        className="mt-5 w-full resize-none rounded-md border border-white/[0.1] bg-slate-950 p-3 text-sm leading-6 outline-none focus:border-cyan-400/60"
      />
      <Button type="button" className="mt-3" onClick={askTwin} disabled={loading}>
        <Send className="h-4 w-4" />
        트윈에게 묻기
      </Button>
      {reflection ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4 text-sm leading-7 text-zinc-200">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-cyan-200">
                {reflection.confidenceLabel}
              </span>
              <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-teal-200">
                {Math.round(reflection.confidence * 100)}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{reflection.answer}</p>
            <div className="mt-4 rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase text-teal-200">데이터 신뢰 게이트</p>
                <span className="font-mono text-xs text-zinc-400">
                  {reflection.trustGate.score} / 상한 {Math.round(reflection.trustGate.ceiling * 100)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{reflection.trustGate.note}</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
              <h2 className="text-sm font-medium text-zinc-100">근거</h2>
              <div className="mt-3 space-y-2">
                {reflection.evidence.length ? (
                  reflection.evidence.map((item, index) => (
                    <article key={`${item.source}-${item.label}-${index}`} className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-cyan-200">{sourceLabel(item.source)}</p>
                        <p className="font-mono text-xs text-zinc-500">{Math.round(item.confidence * 100)}</p>
                      </div>
                      <p className="mt-2 text-sm font-medium text-zinc-200">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">{item.detail}</p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-zinc-500">아직 제시할 근거가 부족합니다.</p>
                )}
              </div>
            </section>

            <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
              <h2 className="text-sm font-medium text-zinc-100">불확실성</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-500">
                {reflection.uncertainties.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-4 rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
                <p className="text-xs font-medium uppercase text-teal-200">다음 질문</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{reflection.nextQuestion}</p>
              </div>
              <p className="mt-4 text-xs leading-5 text-zinc-600">{reflection.guardrail}</p>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    profile: "프로필",
    state: "상태",
    behavior: "행동",
    ontology: "온톨로지",
    memory: "기억",
    message: "대화",
  };
  return labels[source] ?? source;
}
