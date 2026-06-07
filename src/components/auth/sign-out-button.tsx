"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await fetch("/api/auth/native/sign-out", { method: "POST", credentials: "same-origin" });
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" onClick={signOut} disabled={loading}>
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
