"use client";

import { Mic, Plus, Send, Square, Volume2 } from "lucide-react";
import { useMemo, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type { ConversationMessage } from "@/lib/engines/types";
import { cn, isoNow } from "@/lib/utils";

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
};

export function VoiceConsole({ initialMessages, initialConversationId }: VoiceConsoleProps) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(initialConversationId ? "최근 대화를 이어갑니다" : "준비됨");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const holdPointerIdRef = useRef<number | null>(null);
  const suppressNextVoiceClickRef = useRef(false);

  const supportsSpeech = useMemo(() => {
    if (typeof window === "undefined") return false;
    const speechWindow = window as SpeechWindow;
    return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
  }, []);

  async function ensureConversation() {
    if (conversationId) return conversationId;
    const response = await belifeFetch("/api/conversations", { method: "POST" });
    if (!response.ok) throw new Error("대화를 만들지 못했습니다.");
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
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setStatus("음성 입력이 멈췄습니다. 텍스트로 이어서 입력할 수 있어요.");
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setStatus(mode === "hold" ? "누르고 있는 동안 듣는 중" : "듣는 중");
    setIsListening(true);
  }

  function stopListening(nextStatus = "준비됨") {
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
    stopListening("전사를 확인해 주세요");
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
    setConversationId(null);
    setMessages([]);
    setDraft("");
    setIsListening(false);
    setStatus("새 대화를 시작합니다");
    replaceTalkConversationUrl(null);
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  }

  async function send(source: "text" | "voice") {
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setStatus("BELIFE가 해석하는 중");
    setDraft("");
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
      if (!response.ok) throw new Error("메시지를 보내지 못했습니다.");
      const body = (await response.json()) as {
        userMessage: ConversationMessage;
        assistantMessage: ConversationMessage;
      };
      setMessages((current) =>
        current.flatMap((message) =>
          message.id === pendingId ? [body.userMessage, body.assistantMessage] : [message],
        ),
      );
      setStatus("기억과 상태를 업데이트했습니다");
      speak(body.assistantMessage.content);
    } catch (error) {
      if (pendingId) {
        setMessages((current) => current.filter((message) => message.id !== pendingId));
      }
      setDraft(content);
      setStatus(error instanceof Error ? error.message : "보내지 못했습니다.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col rounded-md border border-white/[0.08] bg-[#090909]">
      <div className="border-b border-white/[0.08] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">BELIFE와 대화</h1>
            <p className="mt-1 text-sm text-zinc-500">{status}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="icon" onClick={startFreshConversation} title="새 대화 시작">
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={isListening ? "danger" : "secondary"}
              size="icon"
              onClick={isListening ? () => stopListening() : () => startListening("tap")}
              title={isListening ? "음성 입력 중지" : "음성 입력 시작"}
              disabled={!supportsSpeech}
            >
              {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[88%] rounded-md border p-3 text-sm leading-6",
                message.role === "user"
                  ? "ml-auto border-orange-400/30 bg-orange-500/12 text-orange-50"
                  : "border-white/[0.08] bg-white/[0.04] text-zinc-100",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.role === "assistant" ? (
                <button
                  type="button"
                  onClick={() => speak(message.content)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-orange-200"
                >
                  <Volume2 className="h-3 w-3" />
                  listen
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-md border border-white/[0.08] bg-white/[0.04] p-5 text-sm leading-6 text-zinc-400">
            “BELIFE, 오늘 좀 이상해.”처럼 짧게 말해도 됩니다. 대화는 기억 조각과 자기 구조로 정리됩니다.
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.08] p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="말하거나 입력하세요..."
          className="min-h-24 w-full resize-none rounded-md border border-white/[0.1] bg-black px-3 py-3 text-base leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
        />
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <Button
            type="button"
            variant="secondary"
            onPointerDown={startHoldToTalk}
            onPointerUp={stopHoldToTalk}
            onPointerCancel={stopHoldToTalk}
            onClick={toggleVoiceFromClick}
            title={isListening ? "음성 입력 중지" : "누르고 말하기"}
            disabled={!supportsSpeech || isSending}
          >
            <Mic className="h-4 w-4" />
            {isListening ? "Stop" : "Voice"}
          </Button>
          <Button type="button" onClick={() => send(isListening ? "voice" : "text")} disabled={!draft.trim() || isSending}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
