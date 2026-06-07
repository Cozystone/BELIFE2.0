import { afterEach, describe, expect, it } from "vitest";
import { getReadinessReport } from "@/lib/server/readiness";

describe("getReadinessReport", () => {
  const originalOllamaBaseUrl = process.env.OLLAMA_BASE_URL;

  afterEach(() => {
    process.env.OLLAMA_BASE_URL = originalOllamaBaseUrl;
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
        error: "connection refused",
      },
    });

    const ollama = report.checks.find((check) => check.key === "ollama");
    expect(ollama?.ok).toBe(false);
    expect(ollama?.detail).toContain("connection refused");
  });

  it("reports missing Ollama env before considering localhost fallback", () => {
    delete process.env.OLLAMA_BASE_URL;

    const report = getReadinessReport({
      ollamaHealth: {
        ok: false,
        baseUrl: "http://127.0.0.1:11434",
        models: [],
        error: "OLLAMA_BASE_URL is required for production AI calls on Vercel.",
      },
    });

    const ollama = report.checks.find((check) => check.key === "ollama");
    expect(ollama?.detail).toContain("OLLAMA_BASE_URL is missing");
  });
});
