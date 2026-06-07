"use client";

import { Brain, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";

export function TwinConsole() {
  const [question, setQuestion] = useState("지금 내가 왜 같은 문제를 계속 반복하는지 알려줘");
  const [answer, setAnswer] = useState("");
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
      const body = (await response.json()) as { answer?: string; error?: string };
      setAnswer(body.answer || body.error || "답변을 만들지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-white/[0.08] bg-[#090909] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/12 text-teal-200">
          <Brain className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">Digital Twin</h1>
          <p className="text-sm text-zinc-500">증거 기반으로만 반사하는 제한된 자기 모델</p>
        </div>
      </div>
      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        rows={4}
        className="mt-5 w-full resize-none rounded-md border border-white/[0.1] bg-black p-3 text-sm leading-6 outline-none focus:border-orange-400/60"
      />
      <Button type="button" className="mt-3" onClick={askTwin} disabled={loading}>
        <Send className="h-4 w-4" />
        Ask Twin
      </Button>
      {answer ? (
        <div className="mt-5 whitespace-pre-wrap rounded-md border border-white/[0.08] bg-white/[0.04] p-4 text-sm leading-7 text-zinc-200">
          {answer}
        </div>
      ) : null}
    </div>
  );
}
