import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NativeAuthForm } from "@/components/auth/native-auth-form";
import { isClerkConfigured } from "@/lib/server/auth";
import { isNativeAuthAvailable } from "@/lib/server/native-auth";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#050505] p-5 text-zinc-100">
        <section className="w-full max-w-md rounded-md border border-white/[0.08] bg-white/[0.04] p-6">
          <h1 className="text-2xl font-semibold">Sign in to BELIFE</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Clerk가 연결되지 않은 환경에서는 BELIFE native auth가 Neon 위에서 동작합니다.
          </p>
          <div className="mt-6">
            <NativeAuthForm mode="sign-in" nativeAvailable={isNativeAuthAvailable()} />
          </div>
          <p className="mt-5 text-center text-sm text-zinc-500">
            No account?{" "}
            <Link href="/sign-up" className="text-orange-200 hover:text-orange-100">
              Create one
            </Link>
          </p>
          {!isNativeAuthAvailable() ? (
            <Link href="/app/today" className="mt-5 block">
              <Button variant="secondary" className="w-full">Open local demo</Button>
            </Link>
          ) : null}
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
