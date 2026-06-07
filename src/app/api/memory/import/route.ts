import { importBelifeMemory, memoryImportSchema, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const result = await importBelifeMemory(user, memoryImportSchema.parse(await request.json()));
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to import BELIFE memory." },
      { status: 400 },
    );
  }
}
