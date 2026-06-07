"use client";

import { useEffect, useState } from "react";
import { OntologyGraph } from "@/components/app/ontology-graph";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import type { OntologyGraphModel } from "@/lib/engines/types";
import { cn } from "@/lib/utils";

const views = ["core", "expanded", "full"] as const;

export function SelfMapClient({ initialGraph }: { initialGraph: OntologyGraphModel }) {
  const [view, setView] = useState<(typeof views)[number]>("expanded");
  const [graph, setGraph] = useState(initialGraph);

  useEffect(() => {
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Self Map</h1>
          <p className="mt-1 text-sm text-zinc-500">온톨로지는 전문 용어가 아니라, 해석 가능한 자기 구조입니다.</p>
        </div>
        <div className="flex rounded-md border border-white/[0.08] bg-white/[0.04] p-1">
          {views.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant="ghost"
              className={cn("capitalize", view === item && "bg-orange-500 text-black hover:bg-orange-500 hover:text-black")}
              onClick={() => setView(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>
      <OntologyGraph graph={graph} />
      {graph.edges.length ? (
        <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">Ontology Edges</h2>
              <p className="mt-1 text-sm text-zinc-500">노드 사이의 해석 가능한 연결입니다.</p>
            </div>
            <span className="rounded-md bg-black/40 px-2 py-1 font-mono text-xs text-orange-200">{graph.edges.length}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {graph.edges.slice(0, 6).map((edge) => (
              <article key={edge.id} className="rounded-md border border-white/[0.08] bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase text-orange-200">{edge.label}</span>
                  <span className="font-mono text-xs text-zinc-500">{Math.round(edge.confidence * 100)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{edge.explanation}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {graph.nodes.map((node) => (
          <article key={`${node.type}-${node.label}`} className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">{node.type}</span>
              <span className="font-mono text-orange-200">{node.certainty}</span>
            </div>
            <h2 className="mt-2 text-base font-medium">{node.label}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{node.summary}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
