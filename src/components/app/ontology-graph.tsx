import type { OntologyGraphModel, OntologyGraphRelation, OntologyNode, OntologyNodeType } from "@/lib/engines/types";
import { cn, toPercent } from "@/lib/utils";

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

const relationLabels: Record<OntologyGraphRelation, string> = {
  anchors: "기준이 됨",
  drives: "방향을 밀어줌",
  shapes: "표현을 형성",
  amplifies: "강도를 키움",
  needs_recovery: "회복 단서 필요",
  orients_connection: "관계 방향",
  co_occurs: "함께 관찰",
};

const relationTones: Record<OntologyGraphRelation, { stroke: string; chip: string }> = {
  anchors: { stroke: "rgba(125,211,252,.62)", chip: "border-cyan-200/20 bg-cyan-200/10 text-cyan-100" },
  drives: { stroke: "rgba(167,139,250,.58)", chip: "border-violet-200/20 bg-violet-300/10 text-violet-100" },
  shapes: { stroke: "rgba(45,212,191,.52)", chip: "border-teal-200/20 bg-teal-200/10 text-teal-100" },
  amplifies: { stroke: "rgba(248,113,113,.54)", chip: "border-red-200/20 bg-red-300/10 text-red-100" },
  needs_recovery: { stroke: "rgba(251,113,133,.5)", chip: "border-rose-200/20 bg-rose-200/10 text-rose-100" },
  orients_connection: { stroke: "rgba(129,140,248,.6)", chip: "border-indigo-200/20 bg-indigo-200/10 text-indigo-100" },
  co_occurs: { stroke: "rgba(226,232,240,.34)", chip: "border-slate-200/15 bg-slate-200/10 text-slate-200" },
};

function nodeKey(node: OntologyNode) {
  return node.id ?? `${node.type}:${node.label}`;
}

function positionedNodes(nodes: OntologyNode[]) {
  const visible = nodes.slice(0, 12);
  return visible.map((node, index) => {
    if (index === 0) {
      return { node, x: 50, y: 50, ring: "core" as const };
    }

    const ring = node.tier === "L1" ? 28 : node.tier === "L2" ? 37 : 44;
    const angle = -Math.PI / 2 + ((index - 1) / Math.max(1, visible.length - 1)) * Math.PI * 2;
    return {
      node,
      x: 50 + Math.cos(angle) * ring,
      y: 50 + Math.sin(angle) * (ring * 0.72),
      ring: node.tier === "L1" ? ("inner" as const) : ("outer" as const),
    };
  });
}

function strongestNode(nodes: OntologyNode[]) {
  return nodes.reduce<OntologyNode | null>((best, node) => {
    if (!best) return node;
    if (node.tier === "L1" && best.tier !== "L1") return node;
    return node.confidence > best.confidence ? node : best;
  }, null);
}

function graphSummary(graph: OntologyGraphModel) {
  if (!graph.nodes.length) return "아직 온톨로지 노드가 없습니다. 온보딩이나 첫 대화를 통해 자기 구조가 생깁니다.";
  if (!graph.edges.length) return "자기 구조 노드는 생겼지만, 노드 사이의 관계는 아직 조심스럽게 비워둡니다.";
  const coreCount = graph.nodes.filter((node) => node.tier === "L1").length;
  return `${graph.nodes.length}개의 자기 구조 노드와 ${graph.edges.length}개의 연결 후보가 있습니다. 핵심 구조 ${coreCount}개를 중심으로 현재 패턴을 읽습니다.`;
}

export function OntologyGraph({ graph }: { graph: OntologyGraphModel }) {
  const positioned = positionedNodes(graph.nodes);
  const positionById = new Map(positioned.map(({ node, x, y }) => [nodeKey(node), { x, y }]));
  const visibleEdges = graph.edges
    .filter((edge) => positionById.has(edge.sourceNodeId) && positionById.has(edge.targetNodeId))
    .slice(0, 16);
  const core = strongestNode(graph.nodes);

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-md border border-sky-100/15 bg-[radial-gradient(circle_at_50%_38%,rgba(125,211,252,0.16),transparent_30%),linear-gradient(135deg,#111827,#172033_52%,#111827)] p-4 shadow-2xl shadow-cyan-950/20">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <defs>
          <radialGradient id="belife-node-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(125,211,252,.28)" />
            <stop offset="100%" stopColor="rgba(125,211,252,0)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="34" fill="url(#belife-node-glow)" />
        {visibleEdges.map((edge, index) => {
          const source = positionById.get(edge.sourceNodeId);
          const target = positionById.get(edge.targetNodeId);
          if (!source || !target) return null;
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          const tone = relationTones[edge.relation];
          return (
            <g key={`${edge.id}-${edge.sourceNodeId}-${edge.targetNodeId}-${index}`}>
              <path
                d={`M ${source.x} ${source.y} Q ${midX} ${Math.max(18, midY - 6)} ${target.x} ${target.y}`}
                vectorEffect="non-scaling-stroke"
                fill="none"
                stroke={tone.stroke}
                strokeWidth={Math.max(1.2, edge.confidence * 2.8)}
                strokeLinecap="round"
                opacity={0.82}
              />
              {edge.confidence >= 0.62 ? (
                <circle cx={midX} cy={midY} r="0.8" fill={tone.stroke} opacity=".9" />
              ) : null}
            </g>
          );
        })}
      </svg>

      <div className="absolute left-1/2 top-1/2 z-20 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-cyan-100/30 bg-slate-950/70 text-center shadow-[0_0_70px_rgba(125,211,252,0.25)] backdrop-blur">
        <span className="text-[11px] text-cyan-100/80">중심 구조</span>
        <span className="mt-1 max-w-20 truncate text-sm font-semibold text-white">{core?.label ?? "BELIFE"}</span>
        <span className="mt-1 font-mono text-[10px] text-slate-400">{core ? `${toPercent(core.confidence)}%` : "대기"}</span>
      </div>

      {positioned.map(({ node, x, y, ring }, index) => (
        <div
          key={`${nodeKey(node)}-${index}`}
          className={cn(
            "absolute z-10 w-36 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-slate-950/76 p-3 shadow-xl backdrop-blur-md",
            ring === "core" ? "border-cyan-100/35" : node.tier === "L1" ? "border-violet-100/25" : "border-white/12",
          )}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">{typeLabels[node.type]}</span>
            <span className="rounded-sm bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-cyan-100">{node.tier}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-50">{node.label}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-cyan-200" style={{ width: `${Math.max(8, toPercent(node.confidence))}%` }} />
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4 z-30 grid gap-2 lg:grid-cols-[1fr_.9fr]">
        <div className="rounded-md border border-white/10 bg-slate-950/76 p-3 backdrop-blur">
          <p className="text-xs font-medium text-cyan-100">그래프 요약</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">{graphSummary(graph)}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-slate-950/76 p-3 backdrop-blur">
          <p className="text-xs font-medium text-cyan-100">주요 연결</p>
          {visibleEdges[0] ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-md border px-2 py-1 text-xs", relationTones[visibleEdges[0].relation].chip)}>
                {relationLabels[visibleEdges[0].relation]}
              </span>
              <span className="font-mono text-xs text-slate-400">{toPercent(visibleEdges[0].confidence)}%</span>
            </div>
          ) : (
            <p className="mt-1 text-xs leading-5 text-slate-400">아직 연결을 만들 만큼 반복 신호가 충분하지 않습니다.</p>
          )}
        </div>
      </div>

      {!positioned.length ? (
        <div className="absolute inset-x-6 bottom-6 rounded-md border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300">
          BELIFE와 한 번 대화하거나 온보딩을 마치면 첫 자기 구조 노드가 생깁니다.
        </div>
      ) : null}
    </div>
  );
}
