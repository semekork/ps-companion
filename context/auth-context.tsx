import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";

import { refreshAccessToken, signInWithCode } from "@/services/psn-auth";
import type { StoredAuth } from "@/types/psn";

// ─── Storage keys ────────────────────────────────────────────────────────────

const KEY_ACCESS_TOKEN = "ps_access_token";
const KEY_REFRESH_TOKEN = "ps_refresh_token";
const KEY_ACCOUNT_ID = "ps_account_id";
const KEY_EXPIRES_AT = "ps_expires_at";
const KEY_BIOMETRIC_ENABLED = "ps_biometric_enabled";

// ─── State ───────────────────────────────────────────────────────────────────

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accountId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  biometricEnabled: boolean;
  isUnlocked: boolean;
}

type AuthAction =
  | { type: "LOADING" }
  | { type: "SIGN_IN"; payload: StoredAuth }
  | { type: "SIGN_OUT" }
  | { type: "ERROR"; payload: string }
  | {
      type: "REFRESH";
      payload: { accessToken: string; accessTokenExpiresAt: string };
    }
  | { type: "SET_BIOMETRIC_ENABLED"; payload: boolean }
  | { type: "SET_UNLOCKED"; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOADING":
      return { ...state, isLoading: true, error: null };
    case "SIGN_IN":
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        accountId: action.payload.accountId,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "SIGN_OUT":
      return {
        ...state,
        accessToken: null,
        refreshToken: null,
        accountId: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "REFRESH":
      return { ...state, accessToken: action.payload.accessToken, error: null };
    case "SET_BIOMETRIC_ENABLED":
      return { ...state, biometricEnabled: action.payload };
    case "SET_UNLOCKED":
      return { ...state, isUnlocked: action.payload };
    default:
      return state;
  }
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  accountId: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  biometricEnabled: false,
  isUnlocked: false,
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  /** Pass the Sony OAuth auth code obtained from NpssoWebAuth.authenticate(). */
  signIn: (authCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  authenticateBiometric: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Decode the `sub` claim from a JWT idToken without a library dependency. */
function extractAccountId(idToken: string): string {
  try {
    // JWT uses base64url (- and _ instead of + and /). Convert before decoding.
    const base64url = idToken.split(".")[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    // Pad to a multiple of 4 characters
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return (decoded.sub ?? decoded.accountId ?? "") as string;
  } catch {
    return "";
  }
}

function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

function buildExpiresAt(expiresIn: number): string {
  const now = Date.now();
  // Subtract 60 s buffer so we refresh slightly before true expiry
  return new Date(now + (expiresIn - 60) * 1000).toISOString();
}

async function persistTokens(auth: StoredAuth) {
  await Promise.all([
    SecureStore.setItemAsync(KEY_ACCESS_TOKEN, auth.accessToken),
    SecureStore.setItemAsync(KEY_REFRESH_TOKEN, auth.refreshToken),
    SecureStore.setItemAsync(KEY_ACCOUNT_ID, auth.accountId),
    SecureStore.setItemAsync(KEY_EXPIRES_AT, auth.accessTokenExpiresAt),
  ]);
}

async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN),
    SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN),
    SecureStore.deleteItemAsync(KEY_ACCOUNT_ID),
    SecureStore.deleteItemAsync(KEY_EXPIRES_AT),
  ]);
}

async function loadStoredAuth(): Promise<StoredAuth | null> {
  const [accessToken, refreshToken, accountId, accessTokenExpiresAt] =
    await Promise.all([
      SecureStore.getItemAsync(KEY_ACCESS_TOKEN),
      SecureStore.getItemAsync(KEY_REFRESH_TOKEN),
      SecureStore.getItemAsync(KEY_ACCOUNT_ID),
      SecureStore.getItemAsync(KEY_EXPIRES_AT),
    ]);

  if (!accessToken || !refreshToken || !accountId || !accessTokenExpiresAt)
    return null;
  return { accessToken, refreshToken, accountId, accessTokenExpiresAt };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: restore tokens from secure store and refresh if expired
  useEffect(() => {
    (async () => {
      dispatch({ type: "LOADING" });
      try {
        const stored = await loadStoredAuth();

        if (!stored) {
          dispatch({ type: "SIGN_OUT" });
          return;
        }

        if (!isTokenExpired(stored.accessTokenExpiresAt)) {
          dispatch({ type: "SIGN_IN", payload: stored });
          return;
        }

        // Access token expired — try silent refresh
        const tokens = await refreshAccessToken(stored.refreshToken);
        const updated: StoredAuth = {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken ?? stored.refreshToken,
          accountId: stored.accountId,
          accessTokenExpiresAt: buildExpiresAt(tokens.expiresIn),
        };
        await persistTokens(updated);
        dispatch({ type: "SIGN_IN", payload: updated });
      } catch {
        // Refresh token also expired or missing — force re-auth
        await clearTokens();
        dispatch({ type: "SIGN_OUT" });
      } finally {
        // Load biometric preference
        const biometricPref = await SecureStore.getItemAsync(
          KEY_BIOMETRIC_ENABLED,
        );
        const isEnabled = biometricPref === "true";
        dispatch({ type: "SET_BIOMETRIC_ENABLED", payload: isEnabled });

        // If biometric is enabled, we start as locked.
        // Otherwise, we are "unlocked" by default.
        dispatch({ type: "SET_UNLOCKED", payload: !isEnabled });
      }
    })();
  }, []);

  const authenticateBiometric = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // If they enabled it but somehow lost hardware/enrollment,
        // we might want to bypass or force a reset, but for now just return true if disabled.
        if (!state.biometricEnabled) return true;
        // If it's enabled but no hardware, this is a weird state.
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock PS Companion",
        fallbackLabel: "Use Passcode",
      });

      if (result.success) {
        dispatch({ type: "SET_UNLOCKED", payload: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [state.biometricEnabled]);

  const toggleBiometric = useCallback(async (enabled: boolean) => {
    await SecureStore.setItemAsync(
      KEY_BIOMETRIC_ENABLED,
      enabled ? "true" : "false",
    );
    dispatch({ type: "SET_BIOMETRIC_ENABLED", payload: enabled });
  }, []);

  const signIn = useCallback(async (authCode: string) => {
    dispatch({ type: "LOADING" });
    try {
      const tokens = await signInWithCode(authCode);
      const accountId = extractAccountId(tokens.idToken);
      const auth: StoredAuth = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accountId,
        accessTokenExpiresAt: buildExpiresAt(tokens.expiresIn),
      };
      await persistTokens(auth);
      dispatch({ type: "SIGN_IN", payload: auth });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Sign in failed. Check your NPSSO token.";
      dispatch({ type: "ERROR", payload: msg });
    }
  }, []);

  const signOut = useCallback(async () => {
    await clearTokens();
    dispatch({ type: "SIGN_OUT" });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        toggleBiometric,
        authenticateBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
