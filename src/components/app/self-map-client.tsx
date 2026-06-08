"use client";

import { useEffect, useRef, useState } from "react";
import { OntologyGraph } from "@/components/app/ontology-graph";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type { OntologyGraphModel, OntologyGraphRelation, OntologyNodeType } from "@/lib/engines/types";
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
  anchors: (source, target) => `${source} 신호가 ${target}을 해석하는 기준으로 작동하는지 확인해볼 수 있습니다.`,
  drives: (source, target) => `${source}은 ${target} 쪽 행동 방향을 밀어주는 구조로 보입니다.`,
  shapes: (source, target) => `${source}은 ${target}이 표현되는 방식에 영향을 줄 수 있습니다.`,
  amplifies: (source, target) => `${source}이 ${target}을 더 강하게 만들 수 있어 조심스럽게 관찰합니다.`,
  needs_recovery: (source, target) => `${source}은 ${target} 같은 회복 단서와 함께 봐야 안전합니다.`,
  orients_connection: (source) => `${source}은 더 건강한 연결 방향을 정리하는 신호로 보입니다.`,
  co_occurs: (source, target) => `${source}과 ${target}은 같은 맥락에서 함께 관찰된 초기 신호입니다.`,
};

export function SelfMapClient({ initialGraph }: { initialGraph: OntologyGraphModel }) {
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
          <h1 className="text-2xl font-semibold">셀프 맵</h1>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            대화에서 반복되는 가치, 감정, 선택 패턴을 해석 가능한 지식그래프로 정리합니다.
          </p>
        </div>
        <div className="flex w-full rounded-md border border-white/10 bg-white/[0.05] p-1 sm:w-auto">
          {views.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant="ghost"
              className={cn("flex-1 sm:flex-none", view === item && "bg-cyan-200 text-slate-950 hover:bg-cyan-100 hover:text-slate-950")}
              onClick={() => setView(item)}
            >
              {viewLabels[item]}
            </Button>
          ))}
        </div>
      </div>

      <OntologyGraph graph={graph} />

      {graph.edges.length ? (
        <section className="rounded-md border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">온톨로지 연결</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                노드 사이의 연결은 단정이 아니라, 다시 확인할 수 있는 해석 후보입니다.
              </p>
            </div>
            <span className="rounded-md bg-slate-950/60 px-2 py-1 font-mono text-xs text-cyan-100">{graph.edges.length}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {graph.edges.slice(0, 6).map((edge) => (
              <article key={edge.id} className="rounded-md border border-white/10 bg-slate-950/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-cyan-100">{edge.label}</span>
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
              <span className="font-mono text-cyan-100">{certaintyLabels[node.certainty]}</span>
            </div>
            <h2 className="mt-2 text-base font-medium">{node.label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{node.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
