import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { NativeAuthForm } from "@/components/auth/native-auth-form";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/server/auth";
import { isNativeAuthAvailable } from "@/lib/server/native-auth";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 p-5 text-zinc-100">
        <section className="w-full max-w-md rounded-md border border-white/[0.08] bg-white/[0.04] p-6">
          <h1 className="text-2xl font-semibold">나의 BELIFE 만들기</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            계정을 만들면 대화 기억, 온톨로지, 상태 해석이 개인별로 안전하게 저장됩니다.
          </p>
          <div className="mt-6">
            <NativeAuthForm mode="sign-up" nativeAvailable={isNativeAuthAvailable()} />
          </div>
          <p className="mt-5 text-center text-sm text-zinc-500">
            이미 계정이 있나요?{" "}
            <Link href="/sign-in" className="text-cyan-200 hover:text-cyan-100">
              로그인
            </Link>
          </p>
          {!isNativeAuthAvailable() ? (
            <Link href="/onboarding" className="mt-5 block">
              <Button variant="secondary" className="w-full">
                로컬 데모 시작
              </Button>
            </Link>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-950 p-5">
      <SignUp />
    </main>
  );
}
