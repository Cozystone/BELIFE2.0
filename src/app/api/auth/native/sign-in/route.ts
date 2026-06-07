import { z } from "zod";
import { signInNative } from "@/lib/server/native-auth";

export const runtime = "nodejs";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

function handledSignInError(error: unknown) {
  if (error instanceof z.ZodError) return "Please check your email and password.";
  if (error instanceof Error && error.message === "Invalid email or password.") return error.message;
  return null;
}

export async function POST(request: Request) {
  try {
    const account = await signInNative(signInSchema.parse(await request.json()));
    return Response.json({ ok: true, account });
  } catch (error) {
    const handledError = handledSignInError(error);
    if (handledError) {
      return Response.json({ ok: false, error: handledError });
    }

    console.error("Native sign-in failed", error);
    return Response.json({ ok: false, error: "Unable to sign in." }, { status: 500 });
  }
}
