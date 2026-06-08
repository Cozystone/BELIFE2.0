"use client";

import { useEffect, useRef, useState } from "react";
import { ListTree, Network } from "lucide-react";
import { OntologyGraph } from "@/components/app/ontology-graph";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type {
  BelifeMemoryTimeline,
  OntologyGraphModel,
  OntologyGraphRelation,
  OntologyNodeType,
} from "@/lib/engines/types";
import { withJosa } from "@/lib/memory-display";
import { cn } from "@/lib/utils";

const views = ["core", "expanded", "full"] as const;

const viewLabels: Record<(typeof views)[number], string> = {
  core: "핵심",
  expanded: "확장",
  full: "전체",
};

const typeLabels: Record<OntologyNodeType, string> = {
  Value: "가치",
  Belief: "믿음",
  Goal: "목표",
  EmotionPattern: "감정 패턴",
  DecisionPattern: "결정 패턴",
  FrictionPattern: "마찰 신호",
  EnergyPattern: "에너지",
  GrowthTrajectory: "성장 방향",
  RiskSignal: "주의 신호",
  RecoveryHint: "회복 단서",
  CognitiveBiasCandidate: "해석 주의",
};

const certaintyLabels = {
  EXTRACTED: "직접 근거",
  INFERRED: "추론 근거",
  AMBIGUOUS: "확인 필요",
} as const;

const relationExplanations: Record<OntologyGraphRelation, (source: string, target: string) => string> = {
  anchors: (source, target) => `${withJosa(source, "은/는")} ${withJosa(target, "을/를")} 해석하는 근거로 반복 관찰됩니다.`,
  drives: (source, target) => `${withJosa(source, "이/가")} ${target} 쪽의 선택과 행동 방향을 밀어 주는 구조로 보입니다.`,
  shapes: (source, target) => `${withJosa(source, "이/가")} ${target}의 표현 방식에 영향을 주고 있습니다.`,
  amplifies: (source, target) => `${withJosa(source, "과/와")} ${withJosa(target, "이/가")} 함께 나타날 때 강도가 커질 수 있어 조심스럽게 추적합니다.`,
  needs_recovery: (source, target) => `${withJosa(source, "이/가")} 나타날 때 ${target} 같은 회복 단서가 필요할 수 있습니다.`,
  orients_connection: (source) => `${withJosa(source, "은/는")} 더 건강한 관계 방향을 정리하는 신호로 쓰입니다.`,
  co_occurs: (source, target) => `${withJosa(source, "과/와")} ${withJosa(target, "이/가")} 같은 맥락에서 함께 관찰된 초기 연결입니다.`,
};

export function SelfMapClient({
  initialGraph,
  initialTimeline,
}: {
  initialGraph: OntologyGraphModel;
  initialTimeline: BelifeMemoryTimeline;
}) {
  const [view, setView] = useState<(typeof views)[number]>("expanded");
  const [graph, setGraph] = useState(initialGraph);
  const hasMountedRef = useRef(false);
  const nodeLabelById = new Map(graph.nodes.map((node) => [node.id ?? `${node.type}:${node.label}`, node.label]));

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    let alive = true;
    belifeFetch(`/api/ontology?view=${view}`)
      .then((response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ graph: OntologyGraphModel }>;
      })
      .then((body: { graph: OntologyGraphModel } | null) => {
        if (alive && body) setGraph(body.graph);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [view]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-sky-200/70">
            <Network className="h-3.5 w-3.5" />
            자기 지도
          </div>
          <h1 className="mt-2 text-2xl font-semibold">나를 이해하는 장기기억 지도</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            대화에서 저장된 기억, 반복 패턴, 온톨로지 연결을 함께 보여줍니다. BELIFE가 답변을 만들 때 어떤 근거를 다시 꺼내 쓰는지 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex w-full rounded-md border border-white/10 bg-white/[0.05] p-1 sm:w-auto">
          {views.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant="ghost"
              className={cn("flex-1 sm:flex-none", view === item && "bg-sky-200 text-slate-950 hover:bg-sky-100 hover:text-slate-950")}
              onClick={() => setView(item)}
            >
              {viewLabels[item]}
            </Button>
          ))}
        </div>
      </div>

      <OntologyGraph graph={graph} timeline={initialTimeline} />

      {graph.edges.length ? (
        <section className="rounded-md border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-base font-medium">
                <ListTree className="h-4 w-4 text-sky-200" />
                온톨로지 연결 해석
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                연결은 확정 판정이 아니라, 반복 근거를 바탕으로 한 해석 후보입니다.
              </p>
            </div>
            <span className="rounded-md bg-slate-950/60 px-2 py-1 font-mono text-xs text-sky-100">{graph.edges.length}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {graph.edges.slice(0, 6).map((edge) => (
              <article key={edge.id} className="rounded-md border border-white/10 bg-slate-950/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-sky-100">{edge.label}</span>
                  <span className="font-mono text-xs text-slate-400">{Math.round(edge.confidence * 100)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {relationExplanations[edge.relation](
                    nodeLabelById.get(edge.sourceNodeId) ?? "이 신호",
                    nodeLabelById.get(edge.targetNodeId) ?? "다른 신호",
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {graph.nodes.map((node, index) => (
          <article key={`${node.type}-${node.label}-${index}`} className="rounded-md border border-white/10 bg-white/[0.05] p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{typeLabels[node.type]}</span>
              <span className="font-mono text-sky-100">{certaintyLabels[node.certainty]}</span>
            </div>
            <h2 className="mt-2 text-base font-medium">{node.label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{node.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
