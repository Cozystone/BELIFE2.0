import { describe, expect, it } from "vitest";
import { getReadinessReport } from "@/lib/server/readiness";

describe("getReadinessReport", () => {
  it("surfaces missing production services instead of hiding demo mode", () => {
    const report = getReadinessReport();

    expect(report.checks.map((check) => check.key)).toEqual(["database", "auth", "ollama"]);
    expect(report.status).toMatch(/ready|degraded|setup-required/);
  });

  it("uses Ollama health evidence when provided", () => {
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
});
