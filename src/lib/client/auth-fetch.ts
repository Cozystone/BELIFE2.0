"use client";

function currentReturnPath() {
  if (typeof window === "undefined") return "/app/today";
  return `${window.location.pathname}${window.location.search}`;
}

function signInUrl() {
  return `/sign-in?next=${encodeURIComponent(currentReturnPath())}`;
}

export async function belifeFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    credentials: init?.credentials ?? "same-origin",
  });

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign(signInUrl());
    throw new Error("로그인이 필요합니다.");
  }

  return response;
}
