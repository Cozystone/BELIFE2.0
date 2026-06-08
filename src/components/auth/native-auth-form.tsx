"use client";

import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/sign-in") || value.startsWith("/sign-up")) return null;
  return value;
}

function nextPathFromLocation() {
  if (typeof window === "undefined") return null;
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}

type NativeAuthResponse = {
  ok?: boolean;
  account?: unknown;
  error?: string;
};

export function NativeAuthForm({
  mode,
  nativeAvailable,
}: {
  mode: "sign-in" | "sign-up";
  nativeAvailable: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "sign-up";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nativeAvailable) return;

    setLoading(true);
    setError("");
    const endpoint = isSignUp ? "/api/auth/native/sign-up" : "/api/auth/native/sign-in";
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(isSignUp ? { displayName } : {}),
        }),
      });

      const body = (await response.json().catch(() => ({}))) as NativeAuthResponse;
      if (response.ok && body.ok !== false && body.account) {
        window.location.assign(isSignUp ? "/onboarding" : (nextPathFromLocation() ?? "/app/today"));
      } else {
        setError(body.error || "인증에 실패했습니다.");
      }
    } catch {
      setError("인증 요청을 완료하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {isSignUp ? (
        <label className="block">
          <span className="text-sm text-zinc-300">Name</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={!nativeAvailable}
            className="mt-2 h-11 w-full rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
            placeholder="BELIFE에서 불릴 이름"
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-sm text-zinc-300">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={!nativeAvailable}
          type="email"
          autoComplete="email"
          className="mt-2 h-11 w-full rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
          placeholder="you@example.com"
        />
      </label>
      <label className="block">
        <span className="text-sm text-zinc-300">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={!nativeAvailable}
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="mt-2 h-11 w-full rounded-md border border-white/[0.1] bg-black px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400/60"
          placeholder={isSignUp ? "8자 이상" : "비밀번호"}
        />
      </label>
      {!nativeAvailable ? (
        <p className="rounded-md border border-orange-400/30 bg-orange-500/10 p-3 text-sm leading-6 text-orange-100">
          Native auth requires Neon/DATABASE_URL. Local demo mode is still available.
        </p>
      ) : null}
      {error ? <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={!nativeAvailable || loading}>
        {isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        {isSignUp ? "Create account" : "Sign in"}
      </Button>
      <div className="flex items-start gap-2 text-xs leading-5 text-zinc-500">
        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 flex-none text-zinc-600" />
        Passwords are hashed with scrypt. Sessions are stored as hashed server-side tokens in Neon.
      </div>
    </form>
  );
}
