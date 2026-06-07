"use client";

import { useEffect, useState } from "react";
import { OntologyGraph } from "@/components/app/ontology-graph";
import { Button } from "@/components/ui/button";
import type { OntologyNode } from "@/lib/engines/types";
import { cn } from "@/lib/utils";

const views = ["core", "expanded", "full"] as const;

export function SelfMapClient({ initialNodes }: { initialNodes: OntologyNode[] }) {
  const [view, setView] = useState<(typeof views)[number]>("expanded");
  const [nodes, setNodes] = useState(initialNodes);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ontology?view=${view}`)
      .then((response) => {
        if (response.status === 401) {
          window.location.assign("/sign-in");
          return null;
        }
        if (!response.ok) return null;
        return response.json() as Promise<{ nodes: OntologyNode[] }>;
      })
      .then((body: { nodes: OntologyNode[] } | null) => {
        if (alive && body) setNodes(body.nodes);
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
      <OntologyGraph nodes={nodes} />
      <div className="grid gap-3 md:grid-cols-2">
        {nodes.map((node) => (
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
