import { getOllamaBaseUrl, getOllamaModel } from "@/lib/ai/ollama";
import { hasDatabaseUrl } from "@/lib/db/client";
import { isClerkConfigured } from "./auth";

export type ReadinessStatus = "ready" | "degraded" | "setup-required";

export interface ReadinessCheck {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
  requiredForProduction: boolean;
}

export interface ReadinessReport {
  status: ReadinessStatus;
  checks: ReadinessCheck[];
  nextActions: string[];
}

export function getReadinessReport(): ReadinessReport {
  const databaseOk = hasDatabaseUrl();
  const clerkOk = isClerkConfigured();
  const ollamaOk = Boolean(process.env.OLLAMA_BASE_URL);

  const checks: ReadinessCheck[] = [
    {
      key: "database",
      label: "Neon database",
      ok: databaseOk,
      detail: databaseOk ? "DATABASE_URL is configured." : "DATABASE_URL is missing; app will use in-memory demo state.",
      requiredForProduction: true,
    },
    {
      key: "auth",
      label: "Clerk authentication",
      ok: clerkOk,
      detail: clerkOk ? "Clerk keys are configured." : "Clerk keys are missing; app is running demo auth.",
      requiredForProduction: true,
    },
    {
      key: "ollama",
      label: "External Ollama endpoint",
      ok: ollamaOk,
      detail: ollamaOk
        ? `${getOllamaBaseUrl()} using ${getOllamaModel("chat")}.`
        : "OLLAMA_BASE_URL is missing; Vercel AI calls use deterministic fallback.",
      requiredForProduction: true,
    },
  ];

  const missingRequired = checks.filter((check) => check.requiredForProduction && !check.ok);
  const status: ReadinessStatus =
    missingRequired.length === 0 ? "ready" : databaseOk ? "degraded" : "setup-required";

  return {
    status,
    checks,
    nextActions: missingRequired.map((check) => {
      if (check.key === "auth") {
        return "Accept Clerk Marketplace terms, install Clerk, then pull Vercel env vars.";
      }
      if (check.key === "ollama") {
        return "Set OLLAMA_BASE_URL to an externally reachable Ollama server and redeploy.";
      }
      return "Connect Neon and run npm run db:push.";
    }),
  };
}
