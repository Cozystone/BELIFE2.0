import { clamp, isoNow, sigmoid } from "@/lib/utils";
import type { MentalStateEstimate } from "./types";

const stressWords = [
  "힘들",
  "불안",
  "압박",
  "스트레스",
  "초조",
  "걱정",
  "막막",
  "burnout",
  "stress",
  "anxious",
  "worried",
];

const exhaustionWords = ["지침", "지쳤", "피곤", "무기력", "번아웃", "소진", "exhausted", "tired", "empty"];
const ruminationWords = ["계속", "반복", "자꾸", "생각이 많", "후회", "ruminate", "again"];
const withdrawalWords = ["혼자", "숨고", "연락", "피하고", "withdraw", "alone"];
const motivationWords = ["하고 싶", "목표", "해보", "시작", "가능", "hope", "want", "goal"];

function hitRate(text: string, words: string[]) {
  const lower = text.toLowerCase();
  const hits = words.filter((word) => lower.includes(word.toLowerCase())).length;
  return clamp(hits / Math.max(2, words.length / 2));
}

export function estimateMentalState(
  text: string,
  previous?: MentalStateEstimate | null,
): MentalStateEstimate {
  const stress = hitRate(text, stressWords);
  const exhaustion = hitRate(text, exhaustionWords);
  const rumination = hitRate(text, ruminationWords);
  const withdrawal = hitRate(text, withdrawalWords);
  const motivationSignal = hitRate(text, motivationWords);
  const intensity = clamp((text.match(/[!?]|ㅠ|ㅜ|하\.\.\.|답답/g)?.length ?? 0) / 8);

  const stressLoad = clamp(
    0.4 * stress + 0.3 * exhaustion + 0.15 * rumination + 0.15 * intensity + 0.1 * (previous?.stressLoad ?? 0.2) + 0.08,
  );
  const burnoutRisk = clamp(sigmoid(-1.2 + 1.8 * exhaustion + 1.2 * stress + 0.8 * (1 - motivationSignal)) - 0.18);
  const emotionalVolatility = clamp(0.4 * intensity + 0.25 * stress + 0.2 * rumination + 0.15 * (previous?.emotionalVolatility ?? 0.2));
  const motivation = clamp(0.45 * motivationSignal + 0.25 * (1 - exhaustion) + 0.2 * (previous?.motivation ?? 0.45));
  const socialWithdrawal = clamp(0.55 * withdrawal + 0.25 * stress + 0.2 * (previous?.socialWithdrawal ?? 0.1));
  const supportNeed = clamp(0.35 * stressLoad + 0.25 * burnoutRisk + 0.2 * rumination + 0.2 * socialWithdrawal);
  const confidence = clamp(0.42 + Math.min(text.length, 500) / 1200 + (previous ? 0.12 : 0));

  const drivers = [
    stressLoad > 0.45 ? "stress load" : "",
    burnoutRisk > 0.42 ? "energy depletion" : "",
    rumination > 0.35 ? "repetitive thought loop" : "",
    socialWithdrawal > 0.38 ? "possible withdrawal signal" : "",
  ].filter(Boolean);

  return {
    stressLoad,
    burnoutRisk,
    rumination,
    emotionalVolatility,
    motivation,
    socialWithdrawal,
    supportNeed,
    confidence,
    summary:
      stressLoad > 0.58
        ? "지금은 부담과 생각의 소음이 꽤 큰 상태로 보입니다. 이것은 진단이 아니라 대화 신호 기반 해석입니다."
        : motivation > 0.55
          ? "압박은 있지만 목표를 향한 에너지도 아직 살아 있습니다."
          : "현재 상태는 아직 섞여 있고 형성 중입니다. BELIFE는 단정하기보다 한 가지를 더 물어야 합니다.",
    drivers: drivers.length ? drivers : ["limited but usable self-report signal"],
    createdAt: isoNow(),
  };
}
