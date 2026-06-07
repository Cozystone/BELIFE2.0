import { cn, toPercent } from "@/lib/utils";

export function ScoreBar({
  label,
  value,
  tone = "orange",
}: {
  label: string;
  value: number;
  tone?: "orange" | "teal" | "zinc";
}) {
  const percent = value > 1 ? Math.round(value) : toPercent(value);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="font-mono text-zinc-100">{percent}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-white/[0.08]">
        <div
          className={cn(
            "h-full rounded-sm",
            tone === "orange" && "bg-orange-500",
            tone === "teal" && "bg-teal-400",
            tone === "zinc" && "bg-zinc-300",
          )}
          style={{ width: `${Math.max(4, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}
