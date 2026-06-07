import { AppShell } from "@/components/app/app-shell";
import { isClerkConfigured } from "@/lib/server/auth";
import { ensureUserProfile, requireUserForPage } from "@/lib/server/belife-service";
import { isNativeAuthAvailable } from "@/lib/server/native-auth";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUserForPage();
  const profile = await ensureUserProfile(user);
  const authMode = isClerkConfigured() ? "clerk" : isNativeAuthAvailable() && !user.isDemo ? "native" : "demo";

  return (
    <AppShell userName={profile.nickname || user.name} authMode={authMode}>
      {children}
    </AppShell>
  );
}
