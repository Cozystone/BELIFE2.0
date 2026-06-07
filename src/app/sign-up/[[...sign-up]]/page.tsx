import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/server/auth";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#050505] p-5 text-zinc-100">
        <section className="w-full max-w-md rounded-md border border-white/[0.08] bg-white/[0.04] p-6">
          <h1 className="text-2xl font-semibold">Signup is in demo mode</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Clerk Marketplace integration이 연결되면 이 화면은 실제 회원가입으로 전환됩니다.
          </p>
          <Link href="/onboarding" className="mt-5 block">
            <Button className="w-full">Start onboarding</Button>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#050505] p-5">
      <SignUp />
    </main>
  );
}
