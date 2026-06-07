import { type NextRequest } from "next/server";
import { getOntologyGraphForView, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const requestedView = request.nextUrl.searchParams.get("view");
  const view = requestedView === "core" || requestedView === "expanded" || requestedView === "full" ? requestedView : "expanded";
  const graph = await getOntologyGraphForView(user.id, view);

  return Response.json({ view, nodes: graph.nodes, edges: graph.edges, graph });
}
