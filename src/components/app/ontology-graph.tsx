import type { OntologyNode } from "@/lib/engines/types";
import { cn } from "@/lib/utils";

const positions = [
  "left-[38%] top-[6%]",
  "left-[7%] top-[30%]",
  "left-[62%] top-[28%]",
  "left-[19%] top-[62%]",
  "left-[55%] top-[66%]",
  "left-[41%] top-[42%]",
];

export function OntologyGraph({ nodes }: { nodes: OntologyNode[] }) {
  const visible = nodes.slice(0, 6);

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-md border border-white/[0.08] bg-[#0b0b0b] p-4">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <line x1="50%" y1="50%" x2="45%" y2="15%" stroke="rgba(249,115,22,.35)" />
        <line x1="50%" y1="50%" x2="18%" y2="40%" stroke="rgba(45,212,191,.25)" />
        <line x1="50%" y1="50%" x2="70%" y2="39%" stroke="rgba(249,115,22,.22)" />
        <line x1="50%" y1="50%" x2="28%" y2="73%" stroke="rgba(255,255,255,.13)" />
        <line x1="50%" y1="50%" x2="65%" y2="76%" stroke="rgba(45,212,191,.18)" />
      </svg>
      <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-md border border-orange-400/40 bg-orange-500/15 text-center">
        <span className="text-xs text-orange-200">SELF</span>
        <span className="mt-1 text-xl font-semibold">BELIFE</span>
      </div>
      {visible.map((node, index) => (
        <div
          key={`${node.type}-${node.label}`}
          className={cn(
            "absolute z-10 w-32 rounded-md border bg-black/90 p-3 shadow-xl",
            positions[index],
            node.tier === "L1" ? "border-orange-400/50" : "border-white/[0.12]",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase text-zinc-500">{node.type}</span>
            <span className="font-mono text-[10px] text-orange-200">{node.tier}</span>
          </div>
          <p className="mt-1 text-xs font-medium leading-5 text-zinc-100">{node.label}</p>
        </div>
      ))}
      {!visible.length ? (
        <div className="absolute inset-x-6 bottom-6 rounded-md border border-white/[0.08] bg-white/[0.04] p-4 text-sm text-zinc-400">
          Talk to BELIFE once or complete onboarding to create the first self-structure nodes.
        </div>
      ) : null}
    </div>
  );
}
