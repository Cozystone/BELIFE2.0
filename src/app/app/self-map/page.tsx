import { MemoryTimelinePanel } from "@/components/app/memory-timeline-panel";
import { SelfMapClient } from "@/components/app/self-map-client";
import { getMemoryTimeline, getOntologyGraphForView, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

export default async function SelfMapPage() {
  const user = await requireUserForPage();
  const [graph, timeline] = await Promise.all([
    getOntologyGraphForView(user.id, "expanded"),
    getMemoryTimeline(user.id, 18),
  ]);
  return (
    <div className="space-y-5">
      <SelfMapClient initialGraph={graph} initialTimeline={timeline} />
      <MemoryTimelinePanel timeline={timeline} />
    </div>
  );
}
