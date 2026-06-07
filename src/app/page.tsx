import { ArrowRight, Brain, Fingerprint, Mic, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  { title: "Live AI", body: "말하면 오늘의 상태와 반복 패턴을 해석합니다.", Icon: Mic },
  { title: "Self Map", body: "대화는 기억 조각과 자기 온톨로지로 정리됩니다.", Icon: Brain },
  { title: "Connection", body: "관계 추천은 공개 매칭 전에 내부 프리뷰로 시작합니다.", Icon: Users },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#050505] text-zinc-100">
      <section className="mx-auto flex min-h-[92dvh] w-full max-w-6xl flex-col justify-between px-5 py-6 sm:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-orange-400/30 bg-orange-500/15 text-orange-300">
              <Fingerprint className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold">BELIFE</span>
          </Link>
          <Link href="/app/today" className="text-sm text-zinc-400 hover:text-orange-200">
            Open app
          </Link>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="mb-4 inline-flex rounded-md border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-sm text-orange-200">
              Voice-first personal AI intelligence
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">
              BELIFE
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
              나를 오래 이해하고, 현재 마음의 구조를 해석하며, 더 건강한 관계 선택으로 이어지는 개인 AI 인텔리전스.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Start
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/app/talk">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Talk now
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {features.map(({ title, body, Icon }) => (
              <article key={title} className="rounded-md border border-white/[0.08] bg-white/[0.04] p-5">
                <Icon className="h-5 w-5 text-orange-300" />
                <h2 className="mt-4 font-medium">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
