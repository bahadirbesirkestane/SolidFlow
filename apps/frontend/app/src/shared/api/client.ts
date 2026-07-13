import type { ApiSuccess } from "@/shared/types/api";

type RequestOptions = RequestInit & {
  legacy?: boolean;
};

export class ApiRequestError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, { statusCode, code, details }: { statusCode: number; code: string; details?: unknown }) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

async function readLegacyError(response: Response) {
  try {
    const payload = await response.json();
    if (payload?.error && typeof payload.error === "object") {
      return new ApiRequestError(String(payload.error.message || "Bilinmeyen hata"), {
        statusCode: response.status,
        code: String(payload.error.code || "API_ERROR"),
        details: payload.error.details,
      });
    }

    return String(payload?.error || payload?.detail || "Bilinmeyen hata");
  } catch {
    return response.statusText || "Bilinmeyen hata";
  }
}

export async function apiRequest<T>(input: string, options: RequestOptions = {}) {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorMessage = await readLegacyError(response);
    if (errorMessage instanceof ApiRequestError) {
      throw errorMessage;
    }

    throw new ApiRequestError(String(errorMessage), {
      statusCode: response.status,
      code: "API_ERROR",
    });
  }

  const payload = (await response.json()) as ApiSuccess<T> | T;
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiSuccess<T>).data;
  }

  return payload as T;
}
