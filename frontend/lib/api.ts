const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "x26_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data: unknown = [],
  ) {
    super(message);
  }
}

export type ApiResponse<T = unknown> = {
  success: boolean;
  status: number;
  message: string;
  data: T;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function isApiResponse(value: unknown): value is ApiResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    "status" in value &&
    "message" in value &&
    "data" in value
  );
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const payload: unknown = await res.json().catch(() => ({}));

  if (isApiResponse(payload)) {
    if (!payload.success || !res.ok) {
      throw new ApiError(payload.status, payload.message, payload.data);
    }
    return payload.data as T;
  }

  throw new ApiError(res.status, "Request failed");
}
