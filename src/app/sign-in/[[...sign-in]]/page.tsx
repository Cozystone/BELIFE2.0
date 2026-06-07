import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/server/auth";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#050505] p-5 text-zinc-100">
        <section className="w-full max-w-md rounded-md border border-white/[0.08] bg-white/[0.04] p-6">
          <h1 className="text-2xl font-semibold">Clerk is not configured</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            로컬에서는 demo mode로 바로 앱을 열 수 있습니다. Vercel 배포 전 Clerk 환경변수를 연결하세요.
          </p>
          <Link href="/app/today" className="mt-5 block">
            <Button className="w-full">Open demo app</Button>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#050505] p-5">
      <SignIn />
    </main>
  );
}
