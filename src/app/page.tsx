import { ArrowRight, Brain, Fingerprint, Mic, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  { title: "실시간 대화", body: "말하거나 입력하면 BELIFE가 오늘의 상태와 반복 패턴을 한국어로 정리합니다.", Icon: Mic },
  { title: "셀프 맵", body: "쌓이는 기억을 가치, 믿음, 감정 패턴, 회복 단서가 연결된 지식그래프로 보여줍니다.", Icon: Brain },
  { title: "관계 프리뷰", body: "공개 매칭이 아니라, 나에게 건강한 관계 구조를 먼저 비공개로 해석합니다.", Icon: Users },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-slate-950 text-zinc-100">
      <section className="mx-auto flex min-h-[92dvh] w-full max-w-6xl flex-col justify-between px-5 py-6 sm:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
              <Fingerprint className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold">BELIFE</span>
          </Link>
          <Link href="/app/today" prefetch={false} className="text-sm text-zinc-400 hover:text-cyan-200">
            앱 열기
          </Link>
        </nav>

        <div className="grid gap-8 py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="mb-4 inline-flex rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
              Voice-first 개인 AI 인텔리전스
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight text-white sm:text-6xl">BELIFE</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
              나를 더 오래 이해하고, 현재 마음의 구조를 해석하며, 더 건강한 관계 선택으로 이어지는 개인 AI 서비스입니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  시작하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/app/talk" prefetch={false}>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  지금 대화
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {features.map(({ title, body, Icon }) => (
              <article key={title} className="rounded-md border border-white/[0.08] bg-white/[0.04] p-5">
                <Icon className="h-5 w-5 text-cyan-300" />
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
