import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Access token lives in memory only (not localStorage) to limit XSS exposure.
// The refresh token is an httpOnly cookie managed by the browser.
let accessToken: string | null = null;
export const setAccessToken = (t: string | null) => { accessToken = t; };

export const api = axios.create({ baseURL: "/api/v1", withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Single-flight refresh: refresh tokens rotate, so two parallel refreshes
// (or React StrictMode's double effect) would look like token reuse and
// revoke the session. Everyone shares one in-flight promise instead.
let refreshing: Promise<string> | null = null;
export function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = axios
      .post("/api/v1/auth/refresh", null, { withCredentials: true })
      .then((r) => {
        setAccessToken(r.data.accessToken);
        return r.data.accessToken as string;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

type Retriable = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as Retriable | undefined;
    const isAuthRoute = original?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        await refreshAccessToken();
        return api(original);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event("auth:logout"));
      }
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (e: unknown) =>
  (e as AxiosError<{ error?: string }>)?.response?.data?.error ?? "Something went wrong";
