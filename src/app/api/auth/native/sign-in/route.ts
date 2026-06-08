import { z } from "zod";
import { signInNative } from "@/lib/server/native-auth";

export const runtime = "nodejs";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(128),
});

function handledSignInError(error: unknown) {
  if (error instanceof z.ZodError) return "이메일과 비밀번호를 확인해 주세요.";
  if (error instanceof Error && error.message === "이메일 또는 비밀번호가 올바르지 않습니다.") return error.message;
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
    return Response.json({ ok: false, error: "로그인할 수 없습니다." }, { status: 500 });
  }
}
