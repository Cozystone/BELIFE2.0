"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BrainCircuit,
  DatabaseZap,
  GitBranch,
  LocateFixed,
  Minus,
  Network,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  DEFAULT_COLORS,
  ForceSimulation,
  GraphCanvas,
  useGraphData,
  type DocumentNodeData,
  type GraphApiDocument,
  type GraphApiMemory,
  type GraphNode,
  type GraphThemeColors,
  type MemoryNodeData,
  type MemoryRelation,
  type ViewportState,
} from "@supermemory/memory-graph";
import type {
  BelifeMemoryTimeline,
  BelifeMemoryTimelineItem,
  OntologyGraphModel,
  OntologyGraphRelation,
  OntologyNode,
  OntologyNodeType,
} from "@/lib/engines/types";
import { displayMemoryTag, displayTimelineTitle, withJosa } from "@/lib/memory-display";
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
  anchors: "근거가 됨",
  drives: "방향을 만듦",
  shapes: "표현을 형성",
  amplifies: "강도를 키움",
  needs_recovery: "회복 단서 필요",
  orients_connection: "관계 방향",
  co_occurs: "함께 관찰",
};

const relationToMemoryRelation: Record<OntologyGraphRelation, MemoryRelation> = {
  anchors: "derives",
  drives: "extends",
  shapes: "extends",
  amplifies: "updates",
  needs_recovery: "updates",
  orients_connection: "extends",
  co_occurs: "extends",
};

const timelineKindLabels: Record<BelifeMemoryTimelineItem["kind"], string> = {
  message: "대화",
  memory: "장기기억",
  ontology: "자기 구조",
  ontology_edge: "구조 연결",
  state: "상태 추정",
  behavior: "행동 신호",
  connection: "관계 기억",
};

const graphColors: GraphThemeColors = {
  ...DEFAULT_COLORS,
  bg: "transparent",
  docFill: "#08111f",
  docStroke: "#7dd3fc",
  docInnerFill: "rgba(14, 165, 233, 0.16)",
  memFill: "#102033",
  memFillHover: "#15314a",
  memStrokeDefault: "#38bdf8",
  accent: "#a7f3d0",
  textPrimary: "#f8fafc",
  textSecondary: "#cbd5e1",
  textMuted: "#94a3b8",
  edgeDerives: "rgba(125, 211, 252, 0.48)",
  edgeUpdates: "rgba(251, 113, 133, 0.58)",
  edgeExtends: "rgba(167, 139, 250, 0.4)",
  memBorderForgotten: "#64748b",
  memBorderExpiring: "#fb7185",
  memBorderRecent: "#34d399",
  glowColor: "rgba(45, 212, 191, 0.26)",
  iconColor: "#bae6fd",
  popoverBg: "#08111f",
  popoverBorder: "rgba(125, 211, 252, 0.22)",
  popoverTextPrimary: "#f8fafc",
  popoverTextSecondary: "#cbd5e1",
  popoverTextMuted: "#94a3b8",
  controlBg: "rgba(8, 17, 31, 0.78)",
  controlBorder: "rgba(148, 163, 184, 0.22)",
};

function nodeKey(node: OntologyNode) {
  return node.id ?? `${node.type}:${node.label}`;
}

function documentIdForNode(node: OntologyNode) {
  return `ontology:${nodeKey(node)}`;
}

function summaryMemoryIdForNode(node: OntologyNode) {
  return `ontology-memory:${nodeKey(node)}`;
}

function safeDate(value: string | undefined, fallback: string) {
  return value && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

function makeNodeSummaryMemory(node: OntologyNode, generatedAt: string): GraphApiMemory {
  const date = safeDate(node.lastEvidenceAt, generatedAt);
  return {
    id: summaryMemoryIdForNode(node),
    memory: `${typeLabels[node.type]} · ${node.label}`,
    content: node.summary,
    isStatic: node.certainty !== "EXTRACTED",
    spaceId: node.tier,
    isLatest: node.status === "active",
    isForgotten: node.status !== "active",
    forgetAfter: null,
    forgetReason: node.status !== "active" ? "사용자가 보관한 자기 구조" : null,
    version: Math.max(1, node.evidenceCount),
    parentMemoryId: null,
    rootMemoryId: null,
    createdAt: date,
    updatedAt: date,
    relation: null,
    updatesMemoryId: null,
    nextVersionId: null,
    memoryRelations: {},
    spaceContainerTag: `${typeLabels[node.type]} / ${node.tier}`,
  };
}

function findRelatedNode(item: BelifeMemoryTimelineItem, nodes: OntologyNode[]) {
  const haystack = `${item.title} ${item.body} ${item.tags.join(" ")}`.toLocaleLowerCase("ko-KR");
  let best: { node: OntologyNode; score: number } | null = null;

  for (const node of nodes) {
    const label = node.label.toLocaleLowerCase("ko-KR");
    const type = node.type.toLocaleLowerCase("en-US");
    const score =
      (haystack.includes(label) ? 5 : 0) +
      (item.tags.some((tag) => tag.toLocaleLowerCase("en-US").includes(type)) ? 2 : 0) +
      (item.evidenceType && item.evidenceType === node.certainty ? 1 : 0) +
      (node.tier === "L1" ? 0.5 : 0);

    if (score > 0 && (!best || score > best.score)) {
      best = { node, score };
    }
  }

  return best?.node ?? null;
}

function makeTimelineMemory(
  item: BelifeMemoryTimelineItem,
  index: number,
  generatedAt: string,
  relatedNode?: OntologyNode,
): GraphApiMemory {
  const date = safeDate(item.createdAt, generatedAt);
  const relationTarget = relatedNode ? summaryMemoryIdForNode(relatedNode) : null;

  return {
    id: `timeline:${item.kind}:${item.id}:${index}`,
    memory: `${timelineKindLabels[item.kind]} · ${displayTimelineTitle(item)}`,
    content: item.body,
    isStatic: item.evidenceType !== "EXTRACTED",
    spaceId: relatedNode ? nodeKey(relatedNode) : "recent-memory",
    isLatest: true,
    isForgotten: false,
    forgetAfter: null,
    forgetReason: null,
    version: 1,
    parentMemoryId: null,
    rootMemoryId: null,
    createdAt: date,
    updatedAt: date,
    relation: relatedNode ? "derives" : null,
    updatesMemoryId: null,
    nextVersionId: null,
    memoryRelations: relationTarget ? { [relationTarget]: "derives" } : null,
    spaceContainerTag: timelineKindLabels[item.kind],
  };
}

function buildSupermemoryDocuments(
  graph: OntologyGraphModel,
  timeline?: BelifeMemoryTimeline,
): GraphApiDocument[] {
  const generatedAt = safeDate(graph.generatedAt, new Date().toISOString());
  const docsByNode = new Map<string, GraphApiDocument>();
  const summaryMemoryByNode = new Map<string, GraphApiMemory>();

  for (const node of graph.nodes) {
    const docId = documentIdForNode(node);
    const summaryMemory = makeNodeSummaryMemory(node, generatedAt);
    summaryMemoryByNode.set(nodeKey(node), summaryMemory);
    docsByNode.set(nodeKey(node), {
      id: docId,
      title: node.label,
      summary: `${typeLabels[node.type]} · ${node.summary}`,
      documentType: node.tier === "L1" ? "핵심 구조" : node.tier === "L2" ? "활성 구조" : "보조 구조",
      createdAt: safeDate(node.lastEvidenceAt, generatedAt),
      updatedAt: safeDate(node.lastEvidenceAt, generatedAt),
      memories: [summaryMemory],
    });
  }

  for (const edge of graph.edges) {
    const sourceMemory = summaryMemoryByNode.get(edge.sourceNodeId);
    const targetMemory = summaryMemoryByNode.get(edge.targetNodeId);
    if (!sourceMemory || !targetMemory) continue;

    sourceMemory.memoryRelations = {
      ...(sourceMemory.memoryRelations ?? {}),
      [targetMemory.id]: relationToMemoryRelation[edge.relation],
    };
  }

  const unmatchedMemories: GraphApiMemory[] = [];
  for (const [index, item] of (timeline?.items ?? []).slice(0, 24).entries()) {
    const relatedNode = findRelatedNode(item, graph.nodes);
    const memory = makeTimelineMemory(item, index, generatedAt, relatedNode ?? undefined);

    if (relatedNode) {
      const doc = docsByNode.get(nodeKey(relatedNode));
      if (doc && doc.memories.length < 6) {
        doc.memories.push(memory);
        continue;
      }
    }

    unmatchedMemories.push(memory);
  }

  const documents = [...docsByNode.values()];
  if (unmatchedMemories.length) {
    documents.push({
      id: "timeline:recent-memory",
      title: "최근 장기기억 근거",
      summary: "아직 특정 자기 구조에 묶이지 않은 최근 대화, 메모리, 상태 신호입니다.",
      documentType: "RAG 근거",
      createdAt: generatedAt,
      updatedAt: generatedAt,
      memories: unmatchedMemories.slice(0, 12),
    });
  }

  return documents.slice(0, 18);
}

function formatDate(value: string | undefined) {
  if (!value) return "기록 전";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function activeNodeDetail(node: GraphNode | null) {
  if (!node) return null;
  if (node.type === "document") {
    const data = node.data as DocumentNodeData;
    return {
      badge: data.type,
      title: data.title ?? "이름 없는 구조",
      body: data.summary ?? "아직 요약이 충분하지 않습니다.",
      meta: `${data.memories.length}개 기억 근거 · ${formatDate(data.updatedAt)}`,
      kind: "자기 구조",
    };
  }

  const data = node.data as MemoryNodeData;
  return {
    badge: data.isStatic ? "추론 근거" : "직접 근거",
    title: data.memory,
    body: data.content,
    meta: `${data.version}번째 버전 · ${formatDate(data.updatedAt)}`,
    kind: "장기기억",
  };
}

function summarizeGraph(graph: OntologyGraphModel, documents: GraphApiDocument[]) {
  const memoryCount = documents.reduce((sum, doc) => sum + doc.memories.length, 0);
  if (!documents.length) {
    return "아직 시각화할 장기기억 근거가 없습니다. 대화 탭에서 대화를 시작하면 BELIFE가 기억 후보와 자기 구조를 만들기 시작합니다.";
  }

  const coreCount = graph.nodes.filter((node) => node.tier === "L1").length;
  return `${graph.nodes.length}개의 자기 구조와 ${memoryCount}개의 기억 근거를 함께 배치했습니다. 핵심 구조 ${coreCount}개를 중심으로, 최근 대화와 온톨로지 연결이 어떻게 검색 근거로 쓰이는지 볼 수 있습니다.`;
}

function graphEdgeSentence(edge: OntologyGraphModel["edges"][number], nodeLabelById: Map<string, string>) {
  const source = nodeLabelById.get(edge.sourceNodeId) ?? "이 신호";
  const target = nodeLabelById.get(edge.targetNodeId) ?? "다른 신호";

  switch (edge.relation) {
    case "anchors":
      return `${withJosa(source, "은/는")} ${withJosa(target, "을/를")} 해석하는 근거로 반복 관찰됩니다.`;
    case "drives":
      return `${withJosa(source, "이/가")} ${target} 쪽의 선택과 행동 방향을 밀어 줄 수 있습니다.`;
    case "shapes":
      return `${withJosa(source, "이/가")} ${target}의 표현 방식에 영향을 줄 수 있습니다.`;
    case "amplifies":
      return `${withJosa(source, "과/와")} ${withJosa(target, "이/가")} 함께 나타날 때 강도가 커질 수 있습니다.`;
    case "needs_recovery":
      return `${withJosa(source, "이/가")} 나타날 때 ${target} 같은 회복 단서가 필요할 수 있습니다.`;
    case "orients_connection":
      return `${withJosa(source, "은/는")} 관계 방향을 정리하는 신호로 쓰입니다.`;
    case "co_occurs":
      return `${withJosa(source, "과/와")} ${withJosa(target, "이/가")} 같은 맥락에서 함께 관찰됩니다.`;
  }
}

export function OntologyGraph({
  graph,
  timeline,
}: {
  graph: OntologyGraphModel;
  timeline?: BelifeMemoryTimeline;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<ViewportState | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<ForceSimulation | null>(null);
  const documents = useMemo(() => buildSupermemoryDocuments(graph, timeline), [graph, timeline]);
  const { nodes, edges } = useGraphData(documents, null, size.width, size.height, graphColors);
  const activeNode = useMemo(
    () => nodes.find((node) => node.id === (selectedNode ?? hoveredNode)) ?? null,
    [hoveredNode, nodes, selectedNode],
  );
  const activeDetail = activeNodeDetail(activeNode);
  const highlightedDocumentIds = useMemo(
    () => graph.nodes.filter((node) => node.tier === "L1").map(documentIdForNode),
    [graph.nodes],
  );
  const nodeLabelById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id ?? `${node.type}:${node.label}`, node.label])),
    [graph.nodes],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setSize({
        width: Math.max(0, Math.round(entry.contentRect.width)),
        height: Math.max(0, Math.round(entry.contentRect.height)),
      });
    });
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const nextSimulation = nodes.length ? new ForceSimulation() : null;
    nextSimulation?.init(nodes, edges);

    queueMicrotask(() => {
      if (cancelled) {
        nextSimulation?.destroy();
        return;
      }
      setSimulation(nextSimulation);
    });

    return () => {
      cancelled = true;
      nextSimulation?.destroy();
    };
  }, [edges, nodes]);

  useEffect(() => {
    if (!nodes.length || !viewportRef.current || !size.width || !size.height) return;
    const timer = window.setTimeout(() => {
      viewportRef.current?.fitToNodes(
        nodes.map((node) => ({ x: node.x, y: node.y, size: node.size })),
        size.width,
        size.height,
      );
    }, 260);
    return () => window.clearTimeout(timer);
  }, [nodes, size.height, size.width]);

  const zoomBy = (factor: number) => {
    if (!viewportRef.current || !size.width || !size.height) return;
    viewportRef.current.zoomTo(viewportRef.current.zoom * factor, size.width / 2, size.height / 2);
  };

  const fitGraph = () => {
    if (!viewportRef.current || !nodes.length || !size.width || !size.height) return;
    viewportRef.current.fitToNodes(
      nodes.map((node) => ({ x: node.x, y: node.y, size: node.size })),
      size.width,
      size.height,
    );
  };

  return (
    <section className="overflow-hidden rounded-md border border-sky-200/12 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.14),transparent_34%),linear-gradient(135deg,#07111f,#0f172a_52%,#08111f)] shadow-2xl shadow-sky-950/20">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-md border border-sky-200/20 bg-sky-300/10 text-sky-100">
              <Network className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">장기기억 지식그래프</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{summarizeGraph(graph, documents)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="font-mono text-sky-100">{graph.nodes.length}</div>
              <div className="mt-1 text-slate-500">구조</div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="font-mono text-emerald-100">{documents.reduce((sum, doc) => sum + doc.memories.length, 0)}</div>
              <div className="mt-1 text-slate-500">근거</div>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
              <div className="font-mono text-violet-100">{graph.edges.length}</div>
              <div className="mt-1 text-slate-500">연결</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-[680px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-[520px] border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:36px_36px]" />
          <div ref={containerRef} className="absolute inset-0">
            {size.width > 0 && size.height > 0 ? (
              <GraphCanvas
                colors={graphColors}
                edges={edges}
                height={size.height}
                highlightDocumentIds={highlightedDocumentIds}
                nodes={nodes}
                onNodeClick={(nodeId) => setSelectedNode((current) => (current === nodeId ? null : nodeId))}
                onNodeDragEnd={() => undefined}
                onNodeDragStart={() => undefined}
                onNodeHover={setHoveredNode}
                selectedNodeId={selectedNode}
                simulation={simulation ?? undefined}
                variant="consumer"
                viewportRef={viewportRef}
                width={size.width}
              />
            ) : null}
          </div>

          <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-md border border-white/10 bg-slate-950/70 p-1 backdrop-blur">
            <button
              aria-label="그래프 전체 보기"
              className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              type="button"
              onClick={fitGraph}
            >
              <LocateFixed className="h-4 w-4" />
            </button>
            <button
              aria-label="확대"
              className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => zoomBy(1.18)}
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              aria-label="축소"
              className="flex h-8 w-8 items-center justify-center rounded-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => zoomBy(0.84)}
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          {!documents.length ? (
            <div className="absolute inset-x-6 bottom-6 rounded-md border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300 backdrop-blur">
              대화 탭에서 대화하거나 기억을 가져오면, BELIFE가 장기기억 후보를 만들고 이 화면에 연결 구조를 표시합니다.
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 bg-slate-950/34 p-4">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-sky-100">
              <BrainCircuit className="h-4 w-4" />
              RAG 기억 흐름
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              {[
                ["대화 입력", "사용자 발화와 음성 기록을 원문 근거로 보관"],
                ["기억 청크", "의미 단위, 행동 신호, 상태 신호로 분해"],
                ["온톨로지 승격", "반복되는 가치와 패턴을 자기 구조로 연결"],
                ["응답 검색", "대화, 오늘 브리핑, 트윈 답변에서 근거로 재사용"],
              ].map(([title, body], index) => (
                <div key={title} className="relative flex gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-200/20 bg-sky-300/10 font-mono text-[11px] text-sky-100">
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-slate-100">{title}</div>
                    <div className="mt-0.5 text-xs leading-5 text-slate-500">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-100">
              <DatabaseZap className="h-4 w-4" />
              선택한 노드
            </div>
            {activeDetail ? (
              <div className="mt-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-sm border border-white/10 bg-slate-950/60 px-2 py-1 text-slate-300">{activeDetail.kind}</span>
                  <span className="rounded-sm border border-emerald-200/20 bg-emerald-300/10 px-2 py-1 text-emerald-100">
                    {activeDetail.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-6 text-white">{activeDetail.title}</h3>
                <p className="mt-2 line-clamp-6 text-sm leading-6 text-slate-400">{activeDetail.body}</p>
                <p className="mt-3 text-xs text-slate-500">{activeDetail.meta}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                그래프의 구조 노드나 기억 근거를 누르면, BELIFE가 어떤 근거를 장기기억으로 쓰는지 여기서 확인할 수 있습니다.
              </p>
            )}
          </div>

          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-violet-100">
              <GitBranch className="h-4 w-4" />
              주요 연결
            </div>
            <div className="mt-3 space-y-2">
              {graph.edges.slice(0, 5).map((edge) => (
                <div key={edge.id} className="rounded-md border border-white/10 bg-slate-950/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-200">{relationLabels[edge.relation]}</span>
                    <span className="font-mono text-[11px] text-slate-500">{toPercent(edge.confidence)}%</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{graphEdgeSentence(edge, nodeLabelById)}</p>
                </div>
              ))}
              {!graph.edges.length ? <p className="text-sm leading-6 text-slate-500">아직 연결을 만들 만큼 반복 신호가 충분하지 않습니다.</p> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {[
              ["자기 구조", "border-sky-200/20 bg-sky-300/10 text-sky-100"],
              ["기억 근거", "border-emerald-200/20 bg-emerald-300/10 text-emerald-100"],
              ["갱신/충돌", "border-rose-200/20 bg-rose-300/10 text-rose-100"],
            ].map(([label, tone]) => (
              <span key={label} className={cn("inline-flex items-center gap-1 rounded-sm border px-2 py-1", tone)}>
                <Sparkles className="h-3 w-3" />
                {displayMemoryTag(label)}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
