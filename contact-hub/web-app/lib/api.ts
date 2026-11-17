export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  const accessToken = typeof window !== "undefined" ? sessionStorage.getItem("contact-hub.token") : null;
  try {
    response = await fetch(`/api${path}`, {
      ...options, cache: "no-store", signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000),
      headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
  } catch { throw new ApiError("Unable to reach Contact Hub. Check your connection and try again."); }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = response.status < 500 && typeof body?.message === "string"
      ? body.message : response.status >= 500 ? "The service is unavailable. Please try again later." : "The request could not be completed.";
    throw new ApiError(message, response.status);
  }
  if (body === null) throw new ApiError("The service returned an unexpected response.");
  return body as T;
}
export type Employee = { id: number; email: string; role?: string };
export type Contact = { id: number | string; name: string; email: string; phone: string; interest: string };
export type DailyUsage = { limit: number; used: number; remaining: number; quotaDate: string };
export type Claim = { claimToken: string | null; claimExpiresAt: string | null; count: number; contacts: Contact[]; dailyUsage: DailyUsage };
export type Upload = { id: string; originalFileName: string; status: string; totalRows: number; succesfulRows: number; failedRows: number; errorMeassage: string | null };
