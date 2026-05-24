// src/services/authService.js
// ─────────────────────────────────────────────────────────────────────────────
// All auth-related API calls. Owns token + user persistence.
// ─────────────────────────────────────────────────────────────────────────────

import { api, tokenStore, userStore } from "./api.js";

/**
 * Login with email + password.
 * Saves token and user to localStorage on success.
 * Returns { token, user }.
 */
export async function login({ email, password }) {
  const data = await api.post("/auth/login", { email, password });
  tokenStore.set(data.token);
  userStore.set(data.user);
  return data;
}

/**
 * Register a new account.
 * Saves token and user to localStorage on success.
 * Returns { token, user }.
 */
export async function register({ email, password, name }) {
  const data = await api.post("/auth/register", { email, password, name });
  tokenStore.set(data.token);
  userStore.set(data.user);
  return data;
}

/**
 * Fetch the currently authenticated user's profile.
 * Returns { user }.
 */
export async function getMe() {
  return api.get("/auth/me");
}

/**
 * Clear all local credentials (no server call needed — JWT is stateless).
 */
export function logout() {
  tokenStore.clear();
  userStore.clear();
  window.dispatchEvent(new Event("df:logout"));
}
