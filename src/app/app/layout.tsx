import { AppShell } from "@/components/app/app-shell";
import { isClerkConfigured } from "@/lib/server/auth";
import { ensureUserProfile, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUserForPage();
  const profile = await ensureUserProfile(user);

  return (
    <AppShell userName={profile.nickname || user.name} isClerkEnabled={isClerkConfigured()}>
      {children}
    </AppShell>
  );
}
