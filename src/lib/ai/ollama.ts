import { safeJsonParse } from "@/lib/utils";

export interface OllamaGenerateOptions {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  format?: "json";
}

export function getOllamaBaseUrl() {
  return process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
}

export function getOllamaModel(kind: "chat" | "extractor" = "chat") {
  if (kind === "extractor") return process.env.OLLAMA_MODEL_EXTRACTOR || "dolphin3:latest";
  return process.env.OLLAMA_MODEL_CHAT || "dolphin3:latest";
}

function getTimeoutMs() {
  return Number(process.env.OLLAMA_TIMEOUT_MS || 18000);
}

export async function getOllamaHealth() {
  const baseUrl = getOllamaBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: controller.signal,
      headers: process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : undefined,
    });
    if (!response.ok) {
      return { ok: false, baseUrl, models: [], error: `Ollama returned ${response.status}` };
    }
    const body = (await response.json()) as { models?: Array<{ name: string }> };
    return { ok: true, baseUrl, models: body.models?.map((model) => model.name) ?? [] };
  } catch (error) {
    return {
      ok: false,
      baseUrl,
      models: [],
      error: error instanceof Error ? error.message : "Unable to reach Ollama",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function ollamaGenerate(options: OllamaGenerateOptions) {
  const baseUrl = getOllamaBaseUrl().replace(/\/$/, "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: options.model ?? getOllamaModel("chat"),
        system: options.system,
        prompt: options.prompt,
        stream: false,
        format: options.format,
        options: {
          temperature: options.temperature ?? 0.45,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const body = (await response.json()) as { response?: string };
    return body.response?.trim() || "";
  } finally {
    clearTimeout(timer);
  }
}

export async function ollamaJson<T>(options: OllamaGenerateOptions, fallback: T) {
  try {
    const response = await ollamaGenerate({ ...options, format: "json", model: options.model ?? getOllamaModel("extractor") });
    return safeJsonParse<T>(response, fallback);
  } catch {
    return fallback;
  }
}
