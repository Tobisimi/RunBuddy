import { auth } from "../lib/firebase";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001/api/v1";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as object) },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as { error?: string }).error || `Request failed (${res.status})`;
    const err = new Error(message) as Error & {
      status?: number;
      data?: unknown;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export interface UserContext {
  name?: string;
  age?: number;
  weightRange?: string;
  fitnessLevel?: string;
  goal?: string;
  customGoal?: string | null;
}

export interface RunContext {
  pace: number;
  distance: number;
  durationSeconds: number;
  goalType: string;
  coachMode: string;
  cadenceSpm?: number;
}

export const coachApi = {
  stt: (audioBase64: string, encoding = "LINEAR16", sampleRateHertz = 16000) =>
    apiRequest<{ transcript: string; confidence: number }>("/coach/stt", {
      method: "POST",
      body: JSON.stringify({ audioBase64, encoding, sampleRateHertz }),
    }),

  message: (payload: {
    message: string;
    userContext: UserContext;
    runContext?: RunContext | null;
    isLiveRun: boolean;
  }) =>
    apiRequest<{
      response: string;
      fallback?: boolean;
      remaining: number | null;
    }>("/coach/message", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  tts: (text: string) =>
    apiRequest<{ audioBase64: string }>("/coach/tts", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
};

export const runsApi = {
  start: (payload: {
    goalType: string;
    goalValue: number | null;
    coachMode: string;
  }) =>
    apiRequest<{ runId: string }>("/runs/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  end: (
    runId: string,
    payload: Record<string, unknown>,
  ) =>
    apiRequest<{ runId: string }>(`/runs/${runId}/end`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  list: (limit = 20) =>
    apiRequest<{ runs: unknown[] }>(`/runs?limit=${limit}`),
};

export const usersApi = {
  me: () => apiRequest<Record<string, unknown>>("/users/me"),
};
