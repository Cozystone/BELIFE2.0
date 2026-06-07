import { z } from "zod";
import { signInNative } from "@/lib/server/native-auth";

export const runtime = "nodejs";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

function publicSignInError(error: unknown) {
  if (error instanceof z.ZodError) return "Please check your email and password.";
  if (error instanceof Error && error.message === "Invalid email or password.") return error.message;
  return "Unable to sign in.";
}

export async function POST(request: Request) {
  try {
    const account = await signInNative(signInSchema.parse(await request.json()));
    return Response.json({ account });
  } catch (error) {
    return Response.json(
      { error: publicSignInError(error) },
      { status: 401 },
    );
  }
}
