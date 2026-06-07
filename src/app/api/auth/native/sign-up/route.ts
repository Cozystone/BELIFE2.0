import { z } from "zod";
import { signUpNative } from "@/lib/server/native-auth";

export const runtime = "nodejs";

const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(60),
});

function handledSignUpError(error: unknown) {
  if (error instanceof z.ZodError) return "Please check your sign-up fields.";
  if (error instanceof Error && error.message === "This email is already registered.") return error.message;
  return null;
}

export async function POST(request: Request) {
  try {
    const input = signUpSchema.parse(await request.json());
    const account = await signUpNative(input);
    return Response.json({ ok: true, account });
  } catch (error) {
    const handledError = handledSignUpError(error);
    if (handledError) {
      return Response.json({ ok: false, error: handledError });
    }

    console.error("Native sign-up failed", error);
    return Response.json({ ok: false, error: "Unable to sign up." }, { status: 500 });
  }
}
