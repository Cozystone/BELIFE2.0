import { afterEach, describe, expect, it } from "vitest";
import { buildStructuredExtraction } from "@/lib/ai/structured-extraction";

describe("buildStructuredExtraction", () => {
  const originalVercel = process.env.VERCEL;
  const originalOllamaBaseUrl = process.env.OLLAMA_BASE_URL;

  afterEach(() => {
    process.env.VERCEL = originalVercel;
    process.env.OLLAMA_BASE_URL = originalOllamaBaseUrl;
  });

  it("falls back to deterministic structured signals when Ollama is not configured", async () => {
    process.env.VERCEL = "1";
    delete process.env.OLLAMA_BASE_URL;

    const extraction = await buildStructuredExtraction({
      userId: "u1",
      text: "내 목표는 의미 있는 서비스를 만드는 것이고, 요즘 불안과 걱정이 계속 반복돼.",
      source: "text",
    });

    expect(extraction.usedAi).toBe(false);
    expect(extraction.chunks.length).toBeGreaterThan(0);
    expect(extraction.nodes.some((node) => node.type === "Goal")).toBe(true);
    expect(extraction.nodes.some((node) => node.type === "EmotionPattern")).toBe(true);
    expect(extraction.state.stressLoad).toBeGreaterThan(0.25);
    expect(/[가-힣]/.test(extraction.state.summary)).toBe(true);
    expect(extraction.state.drivers.every((driver) => /[가-힣]/.test(driver))).toBe(true);
    expect(extraction.behavior.confidence).toBeGreaterThan(0.3);
  });
});
