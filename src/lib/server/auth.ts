import { auth, currentUser } from "@clerk/nextjs/server";
import type { BelifeUser } from "@/lib/engines/types";
import { getNativeBelifeUser, shouldAllowDemoUser } from "./native-auth";

export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export async function getBelifeUser(): Promise<BelifeUser | null> {
  if (!isClerkConfigured()) {
    const nativeUser = await getNativeBelifeUser();
    if (nativeUser) return nativeUser;

    if (shouldAllowDemoUser()) {
      return {
        id: "demo-user",
        name: "BELIFE Demo",
        email: "demo@belife.local",
        isDemo: true,
      };
    }

    return null;
  }

  try {
    const session = await auth();
    if (!session.userId) return null;
    const user = await currentUser();
    return {
      id: session.userId,
      name: user?.firstName || user?.fullName || user?.username || "BELIFE user",
      email: user?.primaryEmailAddress?.emailAddress,
      isDemo: false,
    };
  } catch {
    return null;
  }
}
