import { describe, expect, it } from "vitest";
import { estimateMentalState } from "@/lib/engines/mental-state";

describe("estimateMentalState", () => {
  it("raises stress and support need for worry-heavy text", () => {
    const state = estimateMentalState("요즘 너무 불안하고 계속 같은 걱정이 반복돼서 지쳤어.", null);

    expect(state.stressLoad).toBeGreaterThan(0.35);
    expect(state.supportNeed).toBeGreaterThan(0.25);
    expect(state.summary).not.toContain("진단입니다");
  });
});
