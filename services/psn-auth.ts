import { exchangeRefreshTokenForAuthTokens } from "psn-api";

import type { AuthTokens } from "@/types/psn";

// ─── PSN OAuth constants (from psn-api source), these are already public so pushing it is not an issue. Don't come and disturb me with "this was pushed because of vibe coding". ───────────────────────────────

const AUTH_BASE_URL = "https://ca.account.sony.com/api/authz/v3/oauth";
const REDIRECT_URI = "com.scee.psxandroid.scecompcall://redirect";
// Base64 of "CLIENT_ID:CLIENT_SECRET" — same value psn-api ships
const BASIC_AUTH =
  "Basic MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=";

// ─── Auth code → tokens ───────────────────────────────────────────────────────
//
// The NPSSO → auth-code step is handled by NpssoWebAuth (components/).
// React Native's networking stack (NSURLSession on iOS, OkHttp on Android)
// strips manually-set Cookie headers in XHR/fetch, making it impossible to
// pass the NPSSO cookie directly from JS. The WebView approach seeds the
// cookie into WKWebView's own store and captures the custom-scheme redirect.
//
// This function takes the already-obtained code and exchanges it for tokens.

export async function exchangeCodeForTokens(code: string): Promise<AuthTokens> {
  const res = await fetch(`${AUTH_BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: BASIC_AUTH,
    },
    body: new URLSearchParams({
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      token_format: "jwt",
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Token exchange failed (${res.status}). ${body || "Check your NPSSO token."}`,
    );
  }

  const raw = await res.json();

  // Sony responds with snake_case; map to our camelCase AuthTokens shape
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresIn: raw.expires_in,
    tokenType: raw.token_type,
    scope: raw.scope ?? "",
    idToken: raw.id_token ?? "",
  } satisfies AuthTokens;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Exchange a Sony OAuth auth code (obtained via NpssoWebAuth component) for
 * access + refresh tokens. Call this after NpssoWebAuth.authenticate() resolves.
 *
 * @param code  The `code` query parameter from Sony's redirect URL.
 */
export async function signInWithCode(code: string): Promise<AuthTokens> {
  return exchangeCodeForTokens(code);
}

/**
 * Silent token refresh using a stored refresh token.
 * Throws if the refresh token is expired — caller should redirect to /auth.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<AuthTokens> {
  const tokens = await exchangeRefreshTokenForAuthTokens(refreshToken);
  return tokens as unknown as AuthTokens;
}

/**
 * Build an auth object compatible with psn-api function calls.
 */
export function buildPsnAuth(accessToken: string) {
  return { accessToken };
}
