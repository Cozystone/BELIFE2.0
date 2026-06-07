import { MemoryTimelinePanel } from "@/components/app/memory-timeline-panel";
import { SelfMapClient } from "@/components/app/self-map-client";
import { getMemoryTimeline, getOntologyForView, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

export default async function SelfMapPage() {
  const user = await requireUserForPage();
  const [nodes, timeline] = await Promise.all([
    getOntologyForView(user.id, "expanded"),
    getMemoryTimeline(user.id, 18),
  ]);
  return (
    <div className="space-y-5">
      <SelfMapClient initialNodes={nodes} />
      <MemoryTimelinePanel timeline={timeline} />
    </div>
  );
}
