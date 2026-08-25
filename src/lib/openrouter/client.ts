/**
 * LLM provider chain: OpenRouter → NVIDIA (OpenAI-compatible) → NVIDIA OCR.
 *
 * Env contract:
 *   OPENROUTER_API_KEY / OPENROUTER_MODEL / OPENROUTER_VISION_MODEL
 *   NVIDIA_API_KEY
 *   NVIDIA_BASE_URL_1 (OpenAI-compatible chat completions URL) / NVIDIA_MODEL_1
 *   NVIDIA_BASE_URL_2 (OCR endpoint)                  / NVIDIA_MODEL_2
 */

const OPENROUTER_CHAT = "https://openrouter.ai/api/v1/chat/completions";
// NVIDIA reasoning models can take a while to emit their final JSON.
const DEFAULT_TIMEOUT_MS = 120_000;

export function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function isNvidiaConfigured() {
  return Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_BASE_URL_1 && process.env.NVIDIA_MODEL_1);
}

export function anyProviderConfigured() {
  return isOpenRouterConfigured() || isNvidiaConfigured();
}

export function getReminderModel() {
  if (isOpenRouterConfigured() && process.env.OPENROUTER_MODEL) return process.env.OPENROUTER_MODEL;
  if (isNvidiaConfigured()) return process.env.NVIDIA_MODEL_1!;
  return "template";
}

export function getVisionModel() {
  if (isOpenRouterConfigured() && process.env.OPENROUTER_VISION_MODEL) return process.env.OPENROUTER_VISION_MODEL;
  if (isNvidiaConfigured()) return process.env.NVIDIA_MODEL_1!;
  return "template";
}

interface ChatMessageContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

interface ChatOptions {
  system: string;
  user: string;
  imageDataUrl?: string;
  maxTokens?: number;
  /** Skip a provider by name (e.g. after it produced invalid output). */
  excludeProvider?: string;
}

interface Provider {
  name: string;
  url: string;
  key: string;
  model: string;
  headers: Record<string, string>;
}

function providerChain(): Provider[] {
  const chain: Provider[] = [];
  if (isOpenRouterConfigured()) {
    chain.push({
      name: "openrouter",
      url: OPENROUTER_CHAT,
      key: process.env.OPENROUTER_API_KEY!,
      model: getReminderModel(),
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Invoice Nudge",
      },
    });
  }
  if (isNvidiaConfigured()) {
    chain.push({
      name: "nvidia",
      url: process.env.NVIDIA_BASE_URL_1!,
      key: process.env.NVIDIA_API_KEY!,
      model: process.env.NVIDIA_MODEL_1!,
      headers: {},
    });
  }
  return chain;
}

function extractJson(text: string): Record<string, unknown> {
  // Reasoning models (e.g. nemotron) may emit <think>…</think> before/around
  // the JSON — strip it before locating the object.
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain a JSON object.");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

async function chatOnce(provider: Provider, opts: ChatOptions): Promise<Record<string, unknown>> {
  const content: ChatMessageContentPart[] = [];
  if (opts.imageDataUrl) {
    content.push({ type: "image_url", image_url: { url: opts.imageDataUrl } });
  }
  content.push({ type: "text", text: opts.user });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(provider.url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
        ...provider.headers,
      },
      body: JSON.stringify({
        model: provider.model,
        temperature: 0.3,
        max_tokens: opts.maxTokens ?? 1000,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`${provider.name} ${res.status}: ${body.slice(0, 160)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map((p) => p.text ?? "").join("") : "";
    if (!text.trim()) throw new Error(`${provider.name}: empty completion`);
    return extractJson(text);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Runs the prompt across the provider chain and returns the first usable
 * JSON object. Throws an aggregated error only when every provider fails.
 */
export async function chatJson(opts: ChatOptions): Promise<{ data: Record<string, unknown>; provider: string }> {
  const chain = providerChain();
  if (chain.length === 0) {
    throw new Error("No LLM provider configured (set OPENROUTER_API_KEY or NVIDIA_*).");
  }

  const errors: string[] = [];
  for (const provider of chain) {
    if (opts.excludeProvider && provider.name === opts.excludeProvider) continue;
    try {
      const data = await chatOnce(provider, opts);
      return { data, provider: `${provider.name}:${provider.model}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[llm] ${provider.name} failed: ${msg}`);
    }
  }
  throw new Error(`All LLM providers failed: ${errors.join(" | ")}`);
}

/** True when a provider other than `name` is available in the chain. */
export function chatChainHasProviderOtherThan(name: string): boolean {
  return providerChain().some((p) => p.name !== name);
}
