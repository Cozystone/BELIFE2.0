import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NativeAuthForm } from "@/components/auth/native-auth-form";
import { isClerkConfigured } from "@/lib/server/auth";
import { isNativeAuthAvailable } from "@/lib/server/native-auth";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#050505] p-5 text-zinc-100">
        <section className="w-full max-w-md rounded-md border border-white/[0.08] bg-white/[0.04] p-6">
          <h1 className="text-2xl font-semibold">Create your BELIFE</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            계정을 만들면 대화, 기억, 온톨로지, 상태 해석이 개인별로 저장됩니다.
          </p>
          <div className="mt-6">
            <NativeAuthForm mode="sign-up" nativeAvailable={isNativeAuthAvailable()} />
          </div>
          <p className="mt-5 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-orange-200 hover:text-orange-100">
              Sign in
            </Link>
          </p>
          {!isNativeAuthAvailable() ? (
            <Link href="/onboarding" className="mt-5 block">
              <Button variant="secondary" className="w-full">Start local demo</Button>
            </Link>
          ) : null}
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
