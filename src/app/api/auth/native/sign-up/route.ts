import { z } from "zod";
import { signUpNative } from "@/lib/server/native-auth";

export const runtime = "nodejs";

const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(60),
});

export async function POST(request: Request) {
  try {
    const input = signUpSchema.parse(await request.json());
    const account = await signUpNative(input);
    return Response.json({ account });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to sign up." },
      { status: 400 },
    );
  }
}
