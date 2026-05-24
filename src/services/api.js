// src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Base API client — all service modules import from here.
// Handles: base URL, auth headers, token refresh, error normalisation.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

// ── Token storage ─────────────────────────────────────────────────────────────

export const tokenStore = {
  get:    ()      => localStorage.getItem("df_token"),
  set:    (t)     => localStorage.setItem("df_token", t),
  clear:  ()      => localStorage.removeItem("df_token"),
};

export const userStore = {
  get:    ()      => { try { return JSON.parse(localStorage.getItem("df_user")); } catch { return null; } },
  set:    (u)     => localStorage.setItem("df_user", JSON.stringify(u)),
  clear:  ()      => localStorage.removeItem("df_user"),
};

// ── Custom error class ────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name    = "ApiError";
    this.status  = status;
  }
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

/**
 * apiFetch(path, options?)
 *
 * - Automatically attaches Authorization header
 * - Throws ApiError on non-2xx responses
 * - Returns parsed JSON body
 */
export async function apiFetch(path, options = {}) {
  const token = tokenStore.get();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Handle 204 No Content
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 401 → clear stored credentials so app redirects to login
    if (res.status === 401) {
      tokenStore.clear();
      userStore.clear();
      window.dispatchEvent(new Event("df:logout"));
    }
    throw new ApiError(data.error ?? `Request failed (${res.status})`, res.status);
  }

  return data;
}

// ── Convenience method shortcuts ──────────────────────────────────────────────

export const api = {
  get:    (path)         => apiFetch(path),
  post:   (path, body)   => apiFetch(path, { method: "POST",   body: JSON.stringify(body) }),
  patch:  (path, body)   => apiFetch(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: (path)         => apiFetch(path, { method: "DELETE" }),
};
