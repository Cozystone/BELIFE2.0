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
  { href: "/app/today", label: "Today", icon: CircleDot },
  { href: "/app/talk", label: "Talk", icon: MessageCircle },
  { href: "/app/self-map", label: "Self Map", icon: Map },
  { href: "/app/twin", label: "Twin", icon: Brain },
  { href: "/app/connection", label: "Connect", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings },
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
    <div className="min-h-dvh bg-[#050505] text-zinc-100">
      <aside className="fixed left-0 top-0 hidden h-dvh w-64 border-r border-white/[0.08] bg-black/80 p-5 xl:block">
        <Link href="/app/today" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md border border-orange-400/30 bg-orange-500/15 text-orange-300">
            <Fingerprint className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold">BELIFE</span>
            <span className="block text-xs text-zinc-500">Personal intelligence</span>
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
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white",
                  active && "bg-white/[0.08] text-orange-200",
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
              {authMode === "clerk" ? "Clerk session" : authMode === "native" ? "Native session" : "Demo mode"}
            </p>
          </div>
          {authMode === "clerk" ? <UserButton /> : null}
        </div>
      </aside>

      <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 xl:ml-64 xl:pb-10 xl:pt-8">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-black/92 px-2 py-2 backdrop-blur xl:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[10px] text-zinc-500 transition",
                  active && "bg-white/[0.08] text-orange-200",
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
