import { clamp, isoNow, toPercent } from "@/lib/utils";
import type { DataTrustAudit, DataTrustScore, DataTrustSignalKey, EvidenceType } from "./types";

export interface DataTrustInput {
  profileCompleteness: number;
  validSessionDensity: number;
  ontologyStability: number;
  behaviorCoverage: number;
  contradictionInverse?: number;
  recencyCoverage?: number;
  memoryQuality?: number;
}

export function calculateContradictionInverse(evidenceTypes: EvidenceType[]): number {
  if (!evidenceTypes.length) return 0.9;
  const ambiguous = evidenceTypes.filter((type) => type === "AMBIGUOUS").length;
  const inferred = evidenceTypes.filter((type) => type === "INFERRED").length;
  const ambiguousRatio = ambiguous / evidenceTypes.length;
  const inferredRatio = inferred / evidenceTypes.length;
  const uncertaintyPenalty = ambiguousRatio * 0.85 + Math.max(0, inferredRatio - 0.65) * 0.2;
  return clamp(1 - uncertaintyPenalty);
}

export function calculateDataTrust(input: DataTrustInput): DataTrustScore {
  const profileCompleteness = clamp(input.profileCompleteness);
  const validSessionDensity = clamp(input.validSessionDensity);
  const ontologyStability = clamp(input.ontologyStability);
  const behaviorCoverage = clamp(input.behaviorCoverage);
  const contradictionInverse = clamp(input.contradictionInverse ?? 0.9);
  const recencyCoverage = clamp(input.recencyCoverage ?? validSessionDensity);
  const memoryQuality = clamp(input.memoryQuality ?? ontologyStability);

  const score =
    0.27 * profileCompleteness +
    0.22 * validSessionDensity +
    0.18 * ontologyStability +
    0.14 * behaviorCoverage +
    0.07 * contradictionInverse +
    0.04 * recencyCoverage +
    0.08 * memoryQuality;

  const label =
    score >= 0.78 ? "strong" : score >= 0.58 ? "clear" : score >= 0.34 ? "building" : "low";

  return {
    score: toPercent(score),
    label,
    profileCompleteness,
    validSessionDensity,
    ontologyStability,
    behaviorCoverage,
    contradictionInverse,
    recencyCoverage,
    memoryQuality,
    explanation:
      label === "strong"
        ? "BELIFE가 유용한 확신으로 말할 만큼 반복 신호를 충분히 모았습니다."
        : label === "clear"
          ? "초기 자기 구조는 의미 있게 잡혔고, 자연스러운 대화가 쌓일수록 더 선명해집니다."
          : label === "building"
            ? "BELIFE가 당신의 구조를 이해하기 시작했습니다. 해석은 유용한 가설로 받아들이면 좋습니다."
            : "BELIFE는 아직 방향을 잡는 중입니다. 초기 해석은 가볍게 다루는 것이 좋습니다.",
    createdAt: isoNow(),
  };
}

type SignalDefinition = {
  key: DataTrustSignalKey;
  label: string;
  weight: number;
  why: string;
  action: string;
};

const signalDefinitions: SignalDefinition[] = [
  {
    key: "profileCompleteness",
    label: "Profile completeness",
    weight: 0.27,
    why: "온보딩과 핵심 프로필이 비어 있으면 BELIFE가 현재 해석을 개인 구조와 연결하기 어렵습니다.",
    action: "Settings의 Profile Enrichment 제안을 확인하거나 온보딩 답변을 더 구체화하세요.",
  },
  {
    key: "validSessionDensity",
    label: "Session density",
    weight: 0.22,
    why: "반복 세션이 부족하면 단발 감정과 지속 패턴을 구분하기 어렵습니다.",
    action: "며칠 동안 짧은 체크인을 남겨 상태 변화와 반복 생각의 기준선을 만드세요.",
  },
  {
    key: "ontologyStability",
    label: "Ontology stability",
    weight: 0.18,
    why: "핵심 가치, 믿음, 목표가 충분히 안정화되지 않으면 자기 지도 해석이 쉽게 흔들립니다.",
    action: "Talk에서 중요한 선택, 반복 갈등, 회복 단서를 한두 문장씩 더 말해 주세요.",
  },
  {
    key: "behaviorCoverage",
    label: "Behavior coverage",
    weight: 0.14,
    why: "대화 방식과 반응 리듬 신호가 부족하면 BELIFE의 말투와 관계 해석이 덜 맞을 수 있습니다.",
    action: "질문, 거절, 갈등, 부탁 장면을 실제 문장에 가깝게 기록해 주세요.",
  },
  {
    key: "contradictionInverse",
    label: "Contradiction inverse",
    weight: 0.07,
    why: "모호하거나 충돌하는 기억이 많으면 BELIFE는 강한 결론보다 확인 질문을 우선해야 합니다.",
    action: "애매한 기억은 '그때는 그랬지만 지금은 다르다'처럼 시간 맥락을 붙여 주세요.",
  },
  {
    key: "recencyCoverage",
    label: "Recency coverage",
    weight: 0.04,
    why: "최근 신호가 약하면 오래된 패턴이 현재 상태를 과하게 설명할 수 있습니다.",
    action: "오늘의 에너지, 압박, 사람과의 거리감을 짧게 업데이트하세요.",
  },
  {
    key: "memoryQuality",
    label: "Memory quality",
    weight: 0.08,
    why: "기억 품질이 낮으면 추출된 사실과 추론된 가설의 경계가 흐려질 수 있습니다.",
    action: "BELIFE가 틀리게 이해한 부분은 바로잡고, 중요한 단서는 반복해서 확인해 주세요.",
  },
];

function trustValue(trust: DataTrustScore, key: DataTrustSignalKey) {
  return trust[key];
}

function auditSummary(trust: DataTrustScore) {
  if (trust.label === "strong") {
    return "BELIFE는 반복 신호를 바탕으로 비교적 근거 있는 해석을 제공할 수 있습니다.";
  }
  if (trust.label === "clear") {
    return "BELIFE는 유용한 가설을 제시할 수 있지만, 중요한 결론에는 확인 질문을 함께 둡니다.";
  }
  if (trust.label === "building") {
    return "BELIFE는 당신의 구조를 만들고 있는 중입니다. 해석은 방향성 있는 초안으로 보는 것이 안전합니다.";
  }
  return "BELIFE는 아직 충분한 개인 신호를 갖고 있지 않습니다. 초기 해석은 가볍게 확인해야 합니다.";
}

function interpretationGuardrail(trust: DataTrustScore) {
  if (trust.label === "strong") {
    return "강한 신호가 있어도 BELIFE는 진단, 단정, 관계 예측처럼 말하지 않고 근거와 불확실성을 함께 표시합니다.";
  }
  if (trust.label === "clear") {
    return "패턴 연결은 가능하지만 결정적 판단보다 '반복되는 경향'과 '확인할 질문'으로 표현해야 합니다.";
  }
  if (trust.label === "building") {
    return "상태·관계 해석은 가설로 제한하고, 사용자의 확인을 받아 온톨로지를 천천히 강화해야 합니다.";
  }
  return "해석보다 질문이 우선입니다. BELIFE는 낮은 신뢰도에서 강한 조언이나 관계 판단을 피해야 합니다.";
}

export function buildDataTrustAudit(trust: DataTrustScore): DataTrustAudit {
  const weakestSignals = signalDefinitions
    .map((signal) => {
      const value = clamp(trustValue(trust, signal.key));
      return {
        key: signal.key,
        label: signal.label,
        value,
        impact: Number(((1 - value) * signal.weight).toFixed(4)),
        why: signal.why,
      };
    })
    .sort((left, right) => right.impact - left.impact)
    .slice(0, 3);
  const actions = weakestSignals
    .map((signal) => signalDefinitions.find((definition) => definition.key === signal.key)?.action)
    .filter((action): action is string => Boolean(action));

  return {
    generatedAt: isoNow(),
    summary: auditSummary(trust),
    interpretationGuardrail: interpretationGuardrail(trust),
    weakestSignals,
    nextActions: actions,
  };
}
