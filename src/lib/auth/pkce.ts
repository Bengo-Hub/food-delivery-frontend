/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth2 Authorization Code flow.
 * Used by the ordering-frontend to authenticate via the Codevertex SSO.
 */

const VERIFIER_STORAGE_KEY = "sso_code_verifier";
const STATE_STORAGE_KEY = "sso_state";

/** Generate a cryptographically random code verifier (43-128 chars). */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/** Derive the S256 code challenge from a verifier. */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/** Generate a random state parameter for CSRF protection. */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/** Store PKCE verifier in sessionStorage (cleared on tab close). */
export function storeVerifier(verifier: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(VERIFIER_STORAGE_KEY, verifier);
  }
}

/** Retrieve and remove the stored PKCE verifier. */
export function consumeVerifier(): string | null {
  if (typeof window === "undefined") return null;
  const verifier = sessionStorage.getItem(VERIFIER_STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_STORAGE_KEY);
  return verifier;
}

/** Store OAuth state parameter. */
export function storeState(state: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(STATE_STORAGE_KEY, state);
  }
}

/** Retrieve and remove the stored state parameter. */
export function consumeState(): string | null {
  if (typeof window === "undefined") return null;
  const state = sessionStorage.getItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  return state;
}

function base64UrlEncode(buffer: Uint8Array): string {
  let str = "";
  for (const byte of buffer) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
