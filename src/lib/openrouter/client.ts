const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const DEFAULT_TIMEOUT_MS = 30_000;

export function assertOpenRouterEnv() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }
}

export function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function getReminderModel() {
  return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";
}

export function getVisionModel() {
  // Must be a multimodal model; falls back to the reminder model when unset.
  return process.env.OPENROUTER_VISION_MODEL || getReminderModel();
}

function extractJson(text: string): unknown {
  const stripped = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain a JSON object.");
  }
  return JSON.parse(stripped.slice(start, end + 1));
}

interface ChatJsonOptions {
  system: string;
  user: string;
  /** Optional image (data URL) for multimodal extraction. */
  imageDataUrl?: string;
  maxTokens?: number;
}

export async function chatJson(options: ChatJsonOptions): Promise<Record<string, unknown>> {
  assertOpenRouterEnv();

  const content: Array<Record<string, unknown>> = [];
  if (options.imageDataUrl) {
    content.push({ type: "image_url", image_url: { url: options.imageDataUrl } });
  }
  content.push({ type: "text", text: options.user });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Invoice Nudge",
      },
      body: JSON.stringify({
        model: options.imageDataUrl ? getVisionModel() : getReminderModel(),
        temperature: 0.3,
        max_tokens: options.maxTokens ?? 1000,
        messages: [
          { role: "system", content: options.system },
          { role: "user", content },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`OpenRouter request failed (${response.status}): ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("OpenRouter returned an empty completion.");
    }
    return extractJson(text) as Record<string, unknown>;
  } finally {
    clearTimeout(timeout);
  }
}
