import type { ApiSuccess } from "@/shared/types/api";

type RequestOptions = RequestInit & {
  legacy?: boolean;
};

async function readLegacyError(response: Response) {
  try {
    const payload = await response.json();
    return String(payload?.error || payload?.detail || "Bilinmeyen hata");
  } catch {
    return response.statusText || "Bilinmeyen hata";
  }
}

export async function apiRequest<T>(input: string, options: RequestOptions = {}) {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await readLegacyError(response));
  }

  const payload = (await response.json()) as ApiSuccess<T> | T;
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiSuccess<T>).data;
  }

  return payload as T;
}
