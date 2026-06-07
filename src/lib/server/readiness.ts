import { getOllamaBaseUrl, getOllamaModel, type OllamaHealth } from "@/lib/ai/ollama";
import { hasDatabaseUrl } from "@/lib/db/client";
import { isClerkConfigured } from "./auth";
import { isNativeAuthAvailable } from "./native-auth";

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

export function getReadinessReport(options: { ollamaHealth?: OllamaHealth } = {}): ReadinessReport {
  const databaseOk = hasDatabaseUrl();
  const clerkOk = isClerkConfigured();
  const nativeAuthOk = isNativeAuthAvailable();
  const authOk = clerkOk || nativeAuthOk;
  const ollamaConfigured = Boolean(process.env.OLLAMA_BASE_URL);
  const ollamaOk = options.ollamaHealth ? options.ollamaHealth.ok : ollamaConfigured;
  const ollamaDetail = options.ollamaHealth
    ? options.ollamaHealth.ok
      ? `${options.ollamaHealth.baseUrl} is reachable using ${getOllamaModel("chat")}.`
      : `${options.ollamaHealth.baseUrl} is not ready: ${options.ollamaHealth.error || "health check failed"}.`
    : ollamaConfigured
      ? `${getOllamaBaseUrl()} is configured using ${getOllamaModel("chat")}.`
      : "OLLAMA_BASE_URL is missing; Vercel AI calls use deterministic fallback.";

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
      label: "Authentication",
      ok: authOk,
      detail: clerkOk
        ? "Clerk keys are configured."
        : nativeAuthOk
          ? "BELIFE native auth is active on Neon."
          : "No production auth is configured; app is running local demo auth.",
      requiredForProduction: true,
    },
    {
      key: "ollama",
      label: "External Ollama endpoint",
      ok: ollamaOk,
      detail: ollamaDetail,
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
        return "Connect Neon for native auth, or accept Clerk Marketplace terms and install Clerk.";
      }
      if (check.key === "ollama") {
        return "Set OLLAMA_BASE_URL to an externally reachable Ollama server and redeploy.";
      }
      return "Connect Neon and run npm run db:push.";
    }),
  };
}
