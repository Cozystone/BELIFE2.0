import { SelfMapClient } from "@/components/app/self-map-client";
import { getOntologyForView, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

export default async function SelfMapPage() {
  const user = await requireUserForPage();
  const nodes = await getOntologyForView(user.id, "expanded");
  return <SelfMapClient initialNodes={nodes} />;
}
