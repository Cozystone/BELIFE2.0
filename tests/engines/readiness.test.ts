import { afterEach, describe, expect, it } from "vitest";
import { getOllamaRuntimeDiagnostics } from "@/lib/ai/ollama";
import { getReadinessReport } from "@/lib/server/readiness";

function restoreEnv(key: string, value: string | undefined) {
  if (typeof value === "undefined") {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

describe("getReadinessReport", () => {
  const originalOllamaBaseUrl = process.env.OLLAMA_BASE_URL;
  const originalOllamaApiKey = process.env.OLLAMA_API_KEY;
  const originalChatModel = process.env.OLLAMA_MODEL_CHAT;
  const originalExtractorModel = process.env.OLLAMA_MODEL_EXTRACTOR;
  const originalTimeoutMs = process.env.OLLAMA_TIMEOUT_MS;

  afterEach(() => {
    restoreEnv("OLLAMA_BASE_URL", originalOllamaBaseUrl);
    restoreEnv("OLLAMA_API_KEY", originalOllamaApiKey);
    restoreEnv("OLLAMA_MODEL_CHAT", originalChatModel);
    restoreEnv("OLLAMA_MODEL_EXTRACTOR", originalExtractorModel);
    restoreEnv("OLLAMA_TIMEOUT_MS", originalTimeoutMs);
  });

  it("surfaces missing production services instead of hiding demo mode", () => {
    const report = getReadinessReport();

    expect(report.checks.map((check) => check.key)).toEqual(["database", "auth", "ollama"]);
    expect(report.status).toMatch(/ready|degraded|setup-required/);
  });

  it("uses Ollama health evidence when provided", () => {
    process.env.OLLAMA_BASE_URL = "https://ollama.example.com";

    const report = getReadinessReport({
      ollamaHealth: {
        ok: false,
        baseUrl: "https://ollama.example.com",
        models: [],
        error: "Ollama 연결 오류: 연결 거부",
      },
    });

    const ollama = report.checks.find((check) => check.key === "ollama");
    expect(ollama?.ok).toBe(false);
    expect(ollama?.detail).toContain("Ollama 연결 오류: 연결 거부");
  });

  it("reports missing Ollama env before considering localhost fallback", () => {
    delete process.env.OLLAMA_BASE_URL;

    const report = getReadinessReport({
      ollamaHealth: {
        ok: false,
        baseUrl: "http://127.0.0.1:11434",
        models: [],
        error: "Vercel 프로덕션 AI 호출에는 OLLAMA_BASE_URL이 필요합니다.",
      },
    });

    const ollama = report.checks.find((check) => check.key === "ollama");
    expect(ollama?.detail).toContain("OLLAMA_BASE_URL이 없어");
  });

  it("exposes machine-readable Ollama runtime diagnostics", () => {
    process.env.OLLAMA_BASE_URL = "https://ollama.example.com";
    process.env.OLLAMA_API_KEY = "secret";
    process.env.OLLAMA_MODEL_CHAT = "dolphin3:latest";
    process.env.OLLAMA_MODEL_EXTRACTOR = "dolphin3:latest";
    process.env.OLLAMA_TIMEOUT_MS = "25000";

    const diagnostics = getOllamaRuntimeDiagnostics({
      ok: true,
      baseUrl: "https://ollama.example.com",
      models: ["dolphin3:latest"],
    });

    expect(diagnostics).toMatchObject({
      mode: "live",
      configuredForProduction: true,
      endpoint: "https://ollama.example.com",
      chatModel: "dolphin3:latest",
      extractorModel: "dolphin3:latest",
      timeoutMs: 25000,
      apiKeyConfigured: true,
      healthPath: "/api/health/ai",
      readinessPath: "/api/health/readiness",
    });
    expect(diagnostics.requiredEnv).toContain("OLLAMA_BASE_URL");
  });

  it("marks missing production Ollama as deterministic fallback", () => {
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.OLLAMA_API_KEY;

    const diagnostics = getOllamaRuntimeDiagnostics({
      ok: false,
      baseUrl: "http://127.0.0.1:11434",
      models: [],
      error: "missing env",
    });

    expect(diagnostics.mode).toBe("fallback");
    expect(diagnostics.configuredForProduction).toBe(false);
    expect(diagnostics.apiKeyConfigured).toBe(false);
    expect(diagnostics.detail).toContain("OLLAMA_BASE_URL이 없어");
  });
});
