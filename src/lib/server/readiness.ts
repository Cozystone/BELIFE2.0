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
  const ollamaOk = ollamaConfigured && (options.ollamaHealth ? options.ollamaHealth.ok : true);
  const ollamaDetail = !ollamaConfigured
    ? "OLLAMA_BASE_URL이 없어 Vercel AI 호출은 결정론적 fallback을 사용합니다."
    : options.ollamaHealth
      ? options.ollamaHealth.ok
        ? `${options.ollamaHealth.baseUrl}에 ${getOllamaModel("chat")} 모델로 연결할 수 있습니다.`
        : `${options.ollamaHealth.baseUrl} 준비 실패: ${options.ollamaHealth.error || "헬스 체크 실패"}.`
      : `${getOllamaBaseUrl()}가 ${getOllamaModel("chat")} 모델로 설정되어 있습니다.`;

  const checks: ReadinessCheck[] = [
    {
      key: "database",
      label: "Neon 데이터베이스",
      ok: databaseOk,
      detail: databaseOk ? "DATABASE_URL이 설정되어 있습니다." : "DATABASE_URL이 없어 인메모리 데모 상태를 사용합니다.",
      requiredForProduction: true,
    },
    {
      key: "auth",
      label: "인증",
      ok: authOk,
      detail: clerkOk
        ? "Clerk 키가 설정되어 있습니다."
        : nativeAuthOk
          ? "BELIFE 네이티브 인증이 Neon에서 활성화되어 있습니다."
          : "프로덕션 인증이 없어 로컬 데모 인증으로 실행 중입니다.",
      requiredForProduction: true,
    },
    {
      key: "ollama",
      label: "외부 Ollama 엔드포인트",
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
        return "네이티브 인증을 위해 Neon을 연결하거나 Clerk Marketplace 약관을 수락하고 Clerk를 설치하세요.";
      }
      if (check.key === "ollama") {
        return "OLLAMA_BASE_URL을 외부에서 접근 가능한 Ollama 서버로 설정하고 다시 배포하세요.";
      }
      return "Neon을 연결하고 npm run db:push를 실행하세요.";
    }),
  };
}
