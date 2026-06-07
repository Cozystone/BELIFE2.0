import { z } from "zod";
import { signInNative } from "@/lib/server/native-auth";

export const runtime = "nodejs";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  try {
    const account = await signInNative(signInSchema.parse(await request.json()));
    return Response.json({ account });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to sign in." },
      { status: 401 },
    );
  }
}
