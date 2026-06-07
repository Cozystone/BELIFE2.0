import { describe, expect, it } from "vitest";
import { estimateMentalState } from "@/lib/engines/mental-state";

describe("estimateMentalState", () => {
  it("raises stress and support need for worry-heavy text", () => {
    const state = estimateMentalState("요즘 너무 불안하고 계속 같은 걱정이 반복돼서 지쳤어.", null);

    expect(state.stressLoad).toBeGreaterThan(0.35);
    expect(state.supportNeed).toBeGreaterThan(0.25);
    expect(state.motivationalCollapseRisk).toBeGreaterThan(0.25);
    expect(state.abstentionRisk).toBeGreaterThan(0);
    expect(state.summary).not.toContain("진단입니다");
  });

  it("surfaces cognitive distortion as a cautious candidate signal", () => {
    const state = estimateMentalState("항상 다 망한 것 같고, 절대 좋아질 수 없다는 생각이 계속 반복돼.", null);

    expect(state.cognitiveDistortionRisk).toBeGreaterThan(0.35);
    expect(state.drivers).toContain("cognitive distortion candidate");
    expect(state.summary).not.toContain("진단");
  });

  it("computes baseline deviation from the previous state", () => {
    const previous = estimateMentalState("오늘은 조금 피곤하지만 괜찮아.", null);
    const current = estimateMentalState("오늘은 너무 불안하고 지쳐서 혼자 숨고 싶어.", previous);

    expect(current.baselineDeviation).toBeGreaterThan(0);
    expect(current.confidence).toBeGreaterThan(previous.confidence);
  });
});
