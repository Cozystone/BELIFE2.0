"use client";

import { UserButton } from "@clerk/nextjs";
import {
  Brain,
  CircleDot,
  Fingerprint,
  Map,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app/today", label: "오늘", icon: CircleDot },
  { href: "/app/talk", label: "대화", icon: MessageCircle },
  { href: "/app/self-map", label: "맵", icon: Map },
  { href: "/app/twin", label: "트윈", icon: Brain },
  { href: "/app/connection", label: "연결", icon: Users },
  { href: "/app/settings", label: "설정", icon: Settings },
];

export function AppShell({
  children,
  userName,
  authMode,
}: {
  children: React.ReactNode;
  userName: string;
  authMode: "clerk" | "native" | "demo";
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh text-zinc-100">
      <aside className="fixed left-0 top-0 hidden h-dvh w-64 border-r border-white/10 bg-slate-950/78 p-5 backdrop-blur xl:block">
        <Link href="/app/today" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-cyan-200/25 bg-cyan-200/10 text-cyan-100 shadow-[0_0_32px_rgba(125,211,252,0.18)]">
            <Fingerprint className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold">BELIFE</span>
            <span className="block text-xs text-slate-400">개인 인텔리전스</span>
          </span>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white",
                  active && "bg-cyan-200/10 text-cyan-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <div>
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-zinc-500">
              {authMode === "clerk" ? "Clerk 세션" : authMode === "native" ? "네이티브 세션" : "데모 모드"}
            </p>
          </div>
          {authMode === "clerk" ? <UserButton /> : null}
        </div>
      </aside>

      <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 pb-32 pt-4 sm:px-6 xl:ml-64 xl:pb-10 xl:pt-8">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/92 px-2 py-2 backdrop-blur xl:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] text-slate-500 transition",
                  active && "bg-cyan-200/10 text-cyan-100",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
