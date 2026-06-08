"use client";

import { AudioLines, Headphones, Keyboard, Mic, Plus, Send, Sparkles, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type { ConversationMessage } from "@/lib/engines/types";
import { cn, isoNow } from "@/lib/utils";

type DraftSource = "text" | "voice";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function replaceTalkConversationUrl(conversationId: string | null) {
  if (typeof window === "undefined") return;
  const target = conversationId ? `/app/talk?conversation=${encodeURIComponent(conversationId)}` : "/app/talk?conversation=new";
  window.history.replaceState(null, "", target);
}

type VoiceConsoleProps = {
  initialMessages: ConversationMessage[];
  initialConversationId: string | null;
  initialDraft?: string;
};

export function VoiceConsole({ initialMessages, initialConversationId, initialDraft = "" }: VoiceConsoleProps) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState(initialDraft);
  const [draftSource, setDraftSource] = useState<DraftSource>("text");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [supportsTts, setSupportsTts] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const [status, setStatus] = useState(initialConversationId ? "최근 대화를 이어가고 있어요" : "대화 준비 완료");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const holdPointerIdRef = useRef<number | null>(null);
  const suppressNextVoiceClickRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const speechWindow = window as SpeechWindow;
      setSupportsSpeech(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
      setSupportsTts("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, isSending]);

  async function ensureConversation() {
    if (conversationId) return conversationId;
    const response = await belifeFetch("/api/conversations", { method: "POST" });
    if (!response.ok) throw new Error("대화를 만들지 못했어요.");
    const body = (await response.json()) as { conversationId: string };
    setConversationId(body.conversationId);
    replaceTalkConversationUrl(body.conversationId);
    return body.conversationId;
  }

  function startListening(mode: "tap" | "hold" = "tap") {
    if (!supportsSpeech || isListening) return;
    const speechWindow = window as SpeechWindow;
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setDraft(transcript);
      if (transcript) setDraftSource("voice");
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setStatus("음성 입력이 멈췄어요. 텍스트로 이어서 입력할 수 있어요.");
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setStatus(mode === "hold" ? "누르고 있는 동안 듣고 있어요" : "듣고 있어요");
    setIsListening(true);
  }

  function stopListening(nextStatus = "대화 준비 완료") {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatus(nextStatus);
  }

  function capturePointer(event: PointerEvent<HTMLButtonElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some synthetic pointer events do not support capture; hold-to-talk still works without it.
    }
  }

  function releasePointer(event: PointerEvent<HTMLButtonElement>) {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore release failures when the pointer was not captured by the browser.
    }
  }

  function startHoldToTalk(event: PointerEvent<HTMLButtonElement>) {
    if (!supportsSpeech || isSending || holdPointerIdRef.current !== null) return;
    holdPointerIdRef.current = event.pointerId;
    suppressNextVoiceClickRef.current = true;
    capturePointer(event);
    startListening("hold");
  }

  function stopHoldToTalk(event: PointerEvent<HTMLButtonElement>) {
    if (holdPointerIdRef.current !== event.pointerId) return;
    holdPointerIdRef.current = null;
    releasePointer(event);
    stopListening("전송 전에 문장을 확인해 주세요");
  }

  function toggleVoiceFromClick() {
    if (suppressNextVoiceClickRef.current) {
      suppressNextVoiceClickRef.current = false;
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening("tap");
    }
  }

  function startFreshConversation() {
    recognitionRef.current?.abort();
    stopSpeaking();
    setConversationId(null);
    setMessages([]);
    setDraft("");
    setDraftSource("text");
    setIsListening(false);
    setStatus("새 대화를 시작합니다");
    replaceTalkConversationUrl(null);
  }

  function stopSpeaking() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }

  function speak(text: string) {
    if (!supportsTts || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.94;
    utterance.pitch = 1.02;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function updateDraft(value: string) {
    setDraft(value);
    if (!value.trim()) setDraftSource("text");
  }

  async function send() {
    const content = draft.trim();
    if (!content || isSending) return;
    const source = draftSource;
    setIsSending(true);
    setStatus("BELIFE가 기억과 상태를 정리하는 중");
    setDraft("");
    setDraftSource("text");
    let pendingId: string | null = null;

    try {
      const id = await ensureConversation();
      pendingId = `pending-${Date.now()}`;
      const pendingMessage: ConversationMessage = {
        id: pendingId,
        conversationId: id,
        userId: "pending",
        role: "user",
        content,
        source,
        createdAt: isoNow(),
      };
      setMessages((current) => [...current, pendingMessage]);
      const response = await belifeFetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, source }),
      });
      if (!response.ok) throw new Error("메시지를 보내지 못했어요.");
      const body = (await response.json()) as {
        userMessage: ConversationMessage;
        assistantMessage: ConversationMessage;
      };
      setMessages((current) =>
        current.flatMap((message) =>
          message.id === pendingId ? [body.userMessage, body.assistantMessage] : [message],
        ),
      );
      setStatus("기억과 상태를 업데이트했어요");
      if (autoVoice) speak(body.assistantMessage.content);
    } catch (error) {
      if (pendingId) {
        setMessages((current) => current.filter((message) => message.id !== pendingId));
      }
      setDraft(content);
      setDraftSource(source);
      setStatus(error instanceof Error ? error.message : "보내지 못했어요.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-8rem)] flex-col overflow-hidden rounded-md border border-sky-200/15 bg-[radial-gradient(circle_at_50%_0%,rgba(125,211,252,0.2),transparent_34%),linear-gradient(180deg,#111827_0%,#0f172a_46%,#111827_100%)] shadow-2xl shadow-cyan-950/20">
      <div className="pointer-events-none absolute inset-x-10 top-8 h-24 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="relative border-b border-sky-100/10 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-cyan-100/80">
              <Sparkles className="h-3.5 w-3.5" />
              <span>BELIFE 보이스</span>
              <span className="h-1 w-1 rounded-full bg-cyan-200/70" />
              <span>{status}</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-normal text-white">나를 이해하는 대화</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="icon" onClick={startFreshConversation} title="새 대화">
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={autoVoice ? "primary" : "secondary"}
              size="icon"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setAutoVoice((value) => !value);
              }}
              title={autoVoice ? "음성 응답 켜짐" : "음성 응답 꺼짐"}
              disabled={!supportsTts}
            >
              {autoVoice ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <button
            type="button"
            aria-label={isListening ? "음성 정지 오브" : "음성 시작 오브"}
            onPointerDown={startHoldToTalk}
            onPointerUp={stopHoldToTalk}
            onPointerCancel={stopHoldToTalk}
            onClick={toggleVoiceFromClick}
            disabled={!supportsSpeech || isSending}
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-full border transition disabled:opacity-45",
              isListening
                ? "border-cyan-200/70 bg-cyan-200/20 shadow-[0_0_60px_rgba(125,211,252,0.38)]"
                : "border-white/15 bg-white/[0.06] shadow-[0_0_45px_rgba(147,197,253,0.16)] hover:border-cyan-200/45 hover:bg-cyan-200/10",
            )}
          >
            <span className={cn("absolute h-full w-full rounded-full border border-cyan-200/20", isListening && "animate-ping")} />
            {isListening ? <Square className="h-7 w-7 text-cyan-50" /> : <Mic className="h-7 w-7 text-cyan-100" />}
          </button>
          <div className="mt-4 flex h-8 items-end gap-1">
            {[0.35, 0.55, 0.85, 0.62, 0.42].map((height, index) => (
              <span
                key={index}
                className={cn(
                  "w-1.5 rounded-full bg-cyan-200/80 transition-all",
                  isListening ? "animate-pulse" : "opacity-35",
                )}
                style={{ height: `${Math.round(height * (isListening ? 30 : 14))}px`, animationDelay: `${index * 90}ms` }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1">
              <Headphones className="h-3.5 w-3.5 text-cyan-200" />
              {autoVoice ? "답변 자동 음성" : "답변 음성 대기"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1">
              <Keyboard className="h-3.5 w-3.5 text-violet-200" />
              {draftSource === "voice" ? "음성 transcript" : "텍스트 입력"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[88%] rounded-md border p-3 text-sm leading-6 shadow-lg",
                message.role === "user"
                  ? "ml-auto border-cyan-200/20 bg-cyan-200/12 text-cyan-50 shadow-cyan-950/20"
                  : "border-violet-100/15 bg-white/[0.07] text-slate-50 shadow-violet-950/20",
              )}
            >
              <div className="mb-2 flex items-center gap-2 text-[11px] text-slate-400">
                <span>{message.role === "user" ? "나" : "BELIFE"}</span>
                {message.source === "voice" ? <AudioLines className="h-3 w-3 text-cyan-200" /> : null}
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === "assistant" ? (
                <button
                  type="button"
                  onClick={() => speak(message.content)}
                  disabled={!supportsTts}
                  className="mt-3 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-300 transition hover:border-cyan-200/30 hover:text-cyan-100 disabled:opacity-45"
                >
                  <Volume2 className="h-3 w-3" />
                  다시 듣기
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-md border border-white/10 bg-white/[0.06] p-5 text-sm leading-6 text-slate-300">
            짧게 말해도 괜찮아요. BELIFE는 대화를 기억 조각, 상태 신호, 자기 구조로 정리하고 다음 질문을 더 정확하게 맞춥니다.
          </div>
        )}
        {isSending ? (
          <div className="flex max-w-[88%] items-center gap-2 rounded-md border border-violet-100/15 bg-white/[0.07] p-3 text-sm text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-200" />
            분석을 한국어로 정리하는 중
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative border-t border-sky-100/10 bg-slate-950/55 p-3 backdrop-blur">
        <textarea
          value={draft}
          onChange={(event) => updateDraft(event.target.value)}
          rows={3}
          placeholder="말하거나 입력하세요. 음성으로 받은 문장도 전송 전에 고칠 수 있어요."
          className="min-h-24 w-full resize-none rounded-md border border-white/10 bg-white/[0.06] px-3 py-3 text-base leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-200/60 focus:bg-white/[0.08]"
        />
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <Button
            type="button"
            variant="secondary"
            aria-label={isListening ? "Stop" : "Voice"}
            onPointerDown={startHoldToTalk}
            onPointerUp={stopHoldToTalk}
            onPointerCancel={stopHoldToTalk}
            onClick={toggleVoiceFromClick}
            title={isListening ? "음성 입력 중지" : "누르고 말하기"}
            disabled={!supportsSpeech || isSending}
            className="border-cyan-200/15 bg-cyan-200/[0.06] text-cyan-50 hover:bg-cyan-200/[0.11]"
          >
            {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? "정지" : "음성"}
          </Button>
          <Button type="button" aria-label="Send" onClick={send} disabled={!draft.trim() || isSending}>
            <Send className="h-4 w-4" />
            전송
          </Button>
        </div>
      </div>
    </div>
  );
}
