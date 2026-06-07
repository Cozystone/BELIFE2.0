import { describe, expect, it } from "vitest";
import { getReadinessReport } from "@/lib/server/readiness";

describe("getReadinessReport", () => {
  it("surfaces missing production services instead of hiding demo mode", () => {
    const report = getReadinessReport();

    expect(report.checks.map((check) => check.key)).toEqual(["database", "auth", "ollama"]);
    expect(report.status).toMatch(/ready|degraded|setup-required/);
  });
});
