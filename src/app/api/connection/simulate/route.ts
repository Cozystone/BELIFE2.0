import { z } from "zod";
import {
  connectionRelationshipModes,
  connectionScenarioTypes,
  connectionSimulationHorizons,
} from "@/lib/engines/compatibility";
import { isBelifeApiError, requireUserForApi, simulateConnectionForUser } from "@/lib/server/belife-service";

export const runtime = "nodejs";

const simulationSchema = z.object({
  scenarioType: z.enum(connectionScenarioTypes).default("misunderstanding"),
  relationshipMode: z.enum(connectionRelationshipModes).default("friendship"),
  timeHorizon: z.enum(connectionSimulationHorizons).default("immediate"),
  scene: z.string().min(1).max(1200),
  pressure: z.number().min(0).max(1).default(0.45),
  vulnerability: z.number().min(0).max(1).default(0.45),
});

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const simulation = await simulateConnectionForUser(user.id, simulationSchema.parse(await request.json()));
    return Response.json({ simulation });
  } catch (error) {
    if (isBelifeApiError(error)) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "관계 시뮬레이션 요청 형식을 확인해 주세요." },
      { status: 400 },
    );
  }
}
