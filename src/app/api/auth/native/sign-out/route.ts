import { signOutNative } from "@/lib/server/native-auth";

export const runtime = "nodejs";

export async function POST() {
  await signOutNative();
  return Response.json({ ok: true });
}
