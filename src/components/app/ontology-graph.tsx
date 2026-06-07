import type { OntologyGraphModel, OntologyNode } from "@/lib/engines/types";
import { cn } from "@/lib/utils";

const positions = [
  { x: 50, y: 13 },
  { x: 18, y: 30 },
  { x: 78, y: 30 },
  { x: 23, y: 69 },
  { x: 72, y: 70 },
  { x: 50, y: 49 },
  { x: 34, y: 48 },
  { x: 64, y: 49 },
];

function nodeKey(node: OntologyNode) {
  return node.id ?? `${node.type}:${node.label}`;
}

export function OntologyGraph({ graph }: { graph: OntologyGraphModel }) {
  const visible = graph.nodes.slice(0, 8);
  const positioned = visible.map((node, index) => ({ node, position: positions[index] ?? positions[positions.length - 1] }));
  const positionById = new Map(positioned.map(({ node, position }) => [nodeKey(node), position]));
  const visibleEdges = graph.edges.filter((edge) => positionById.has(edge.sourceNodeId) && positionById.has(edge.targetNodeId)).slice(0, 10);

  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-md border border-white/[0.08] bg-[#0b0b0b] p-4">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {visibleEdges.map((edge) => {
          const source = positionById.get(edge.sourceNodeId);
          const target = positionById.get(edge.targetNodeId);
          if (!source || !target) return null;
          const color = edge.relation === "needs_recovery" || edge.relation === "amplifies" ? "rgba(249,115,22,.34)" : "rgba(45,212,191,.28)";
          return (
            <line
              key={edge.id}
              x1={`${source.x}%`}
              y1={`${source.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke={color}
              strokeWidth={Math.max(1, edge.confidence * 2.2)}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-md border border-orange-400/40 bg-orange-500/15 text-center">
        <span className="text-xs text-orange-200">SELF</span>
        <span className="mt-1 text-xl font-semibold">BELIFE</span>
      </div>
      {positioned.map(({ node, position }) => (
        <div
          key={`${node.type}-${node.label}`}
          className={cn(
            "absolute z-10 w-32 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-black/90 p-3 shadow-xl",
            node.tier === "L1" ? "border-orange-400/50" : "border-white/[0.12]",
          )}
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase text-zinc-500">{node.type}</span>
            <span className="font-mono text-[10px] text-orange-200">{node.tier}</span>
          </div>
          <p className="mt-1 text-xs font-medium leading-5 text-zinc-100">{node.label}</p>
        </div>
      ))}
      {visibleEdges.length ? (
        <div className="absolute bottom-4 left-4 right-4 z-20 grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-white/[0.08] bg-black/80 p-3">
            <p className="text-xs font-medium text-zinc-100">Graph Summary</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">{graph.summary}</p>
          </div>
          <div className="rounded-md border border-white/[0.08] bg-black/80 p-3">
            <p className="text-xs font-medium text-zinc-100">Strongest Edge</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              {visibleEdges[0].label} · {Math.round(visibleEdges[0].confidence * 100)}%
            </p>
          </div>
        </div>
      ) : null}
      {!visible.length ? (
        <div className="absolute inset-x-6 bottom-6 rounded-md border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-zinc-400">
          Talk to BELIFE once or complete onboarding to create the first self-structure nodes.
        </div>
      ) : null}
    </div>
  );
}
