export class HttpError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "HttpError";
    this.code = code;
  }
}

export async function requestJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }

  const text = await response.text();

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON body (e.g. an HTML error page) — handled below.
    }
  }

  if (!response.ok) {
    const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const message =
      obj && typeof obj.error === "string" ? obj.error : `Request failed (${response.status})`;
    throw new HttpError(message, typeof obj?.code === "string" ? obj.code : undefined);
  }

  if (!data || typeof data !== "object") {
    throw new Error("The server returned an unexpected empty response.");
  }

  return data as T;
}
