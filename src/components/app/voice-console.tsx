"use client";

import { Mic, Send, Square, Volume2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ConversationMessage } from "@/lib/engines/types";
import { cn } from "@/lib/utils";

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

export function VoiceConsole({ initialMessages }: { initialMessages: ConversationMessage[] }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("Ready");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const supportsSpeech = useMemo(() => {
    if (typeof window === "undefined") return false;
    const speechWindow = window as SpeechWindow;
    return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
  }, []);

  async function ensureConversation() {
    if (conversationId) return conversationId;
    const response = await fetch("/api/conversations", { method: "POST" });
    if (!response.ok) throw new Error("Unable to create conversation");
    const body = (await response.json()) as { conversationId: string };
    setConversationId(body.conversationId);
    return body.conversationId;
  }

  function startListening() {
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
      setStatus("Voice input stopped. You can type instead.");
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setStatus("Listening");
    setIsListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setStatus("Ready");
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
    setStatus("BELIFE is interpreting");
    setDraft("");

    try {
      const id = await ensureConversation();
      const response = await fetch(`/api/conversations/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, source }),
      });
      if (!response.ok) throw new Error("Message failed");
      const body = (await response.json()) as {
        userMessage: ConversationMessage;
        assistantMessage: ConversationMessage;
      };
      setMessages((current) => [...current, body.userMessage, body.assistantMessage]);
      setStatus("Updated memory and state");
      speak(body.assistantMessage.content);
    } catch (error) {
      setDraft(content);
      setStatus(error instanceof Error ? error.message : "Unable to send");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col rounded-md border border-white/[0.08] bg-[#090909]">
      <div className="border-b border-white/[0.08] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Talk to BELIFE</h1>
            <p className="mt-1 text-sm text-zinc-500">{status}</p>
          </div>
          <Button
            type="button"
            variant={isListening ? "danger" : "secondary"}
            size="icon"
            onClick={isListening ? stopListening : startListening}
            title={isListening ? "Stop voice input" : "Start voice input"}
            disabled={!supportsSpeech}
          >
            {isListening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
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
            “BELIFE, 오늘 좀 이상해.”처럼 짧게 말해도 됩니다. 대화는 기억 조각과 자기 구조로 변환됩니다.
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
          <Button type="button" variant="secondary" onClick={isListening ? stopListening : startListening} disabled={!supportsSpeech}>
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
