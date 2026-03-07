/**
 * NpssoWebAuth — hidden WebView that exchanges an NPSSO token for a Sony
 * OAuth auth code, bypassing React Native's Cookie-header stripping issue.
 *
 * Flow:
 *  1. Navigate to https://ca.account.sony.com/ (correct Sony domain origin).
 *  2. On load, inject JS that sets document.cookie for that domain and then
 *     calls window.ReactNativeWebView.postMessage('cookie-set').
 *  3. onMessage receives 'cookie-set' → THEN navigate to the OAuth authorize
 *     URL. This guarantees the cookie is in WKWebView's store before the auth
 *     request fires (injectJavaScript is async; navigating immediately after
 *     calling it races with cookie execution).
 *  4. Sony 302-redirects to com.scee.psxandroid.scecompcall://redirect?code=…
 *  5. onShouldStartLoadWithRequest and onNavigationStateChange both intercept
 *     the custom-scheme URL, extract the code, and resolve the Promise.
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import WebView from "react-native-webview";

// ─── OAuth constants (same values psn-api ships) ─────────────────────────────

const AUTH_BASE_URL = "https://ca.account.sony.com/api/authz/v3/oauth";
const CLIENT_ID = "09515159-7237-4370-9b40-3806e67c0891";
const REDIRECT_URI = "com.scee.psxandroid.scecompcall://redirect";
const SCOPE = "psn:mobile.v2.core psn:clientapp";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NpssoWebAuthRef {
  /** Exchanges an NPSSO token for a Sony OAuth auth code. */
  authenticate: (npsso: string) => Promise<string>;
}

type Phase = "idle" | "seeding-cookie" | "authorizing";

// ─── Component ────────────────────────────────────────────────────────────────

export const NpssoWebAuth = forwardRef<NpssoWebAuthRef>(
  function NpssoWebAuth(_, ref) {
    const webViewRef = useRef<WebView>(null);
    const resolveRef = useRef<((code: string) => void) | null>(null);
    const rejectRef = useRef<((err: Error) => void) | null>(null);
    const npssoRef = useRef<string>("");

    const [phase, setPhase] = useState<Phase>("idle");
    const [source, setSource] = useState<{ uri: string } | { html: string }>({
      html: "",
    });

    // Authorise URL built once per auth attempt
    const authorizeUrl = useRef<string>("");

    useImperativeHandle(ref, () => ({
      authenticate(npsso: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          resolveRef.current = resolve;
          rejectRef.current = reject;
          npssoRef.current = npsso;

          const params = new URLSearchParams({
            access_type: "offline",
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            response_type: "code",
            scope: SCOPE,
          });
          authorizeUrl.current = `${AUTH_BASE_URL}/authorize?${params.toString()}`;

          // Phase 1: load Sony's domain so we can write a first-party cookie
          setPhase("seeding-cookie");
          setSource({ uri: "https://ca.account.sony.com/" });
        });
      },
    }));

    // Phase 1 load complete: seed the NPSSO cookie, then wait for the JS
    // to confirm via postMessage before we navigate to the authorize URL.
    function handleLoadEnd() {
      if (phase !== "seeding-cookie") return;
      const npsso = npssoRef.current;
      // After setting the cookie, post a message back so we know it's done.
      webViewRef.current?.injectJavaScript(
        `(function(){
          document.cookie = "npsso=${npsso}; domain=.account.sony.com; path=/; SameSite=None; Secure";
          window.ReactNativeWebView.postMessage('cookie-set');
        })();`,
      );
    }

    // Received 'cookie-set' from injected JS → now safe to navigate.
    function handleMessage(e: { nativeEvent: { data: string } }) {
      if (e.nativeEvent.data === "cookie-set" && phase === "seeding-cookie") {
        setPhase("authorizing");
        setSource({ uri: authorizeUrl.current });
      }
    }

    // Intercept the custom-scheme redirect in BOTH hooks — whichever fires
    // first wins; settle() is a no-op after the first call.
    function handleShouldStartLoad(request: { url: string }) {
      return !interceptRedirect(request.url);
    }

    function handleNavigationStateChange(navState: { url: string }) {
      interceptRedirect(navState.url);
    }

    function handleError(e: {
      nativeEvent: { url?: string; description?: string };
    }) {
      const url = e.nativeEvent.url ?? "";
      // iOS fires onError when it can't load a custom-scheme URL.
      if (interceptRedirect(url)) return;
      // Ignore errors during the cookie-seeding page load (e.g. CA cert issues
      // on the Sony landing page) — we only care about the authorize phase.
      if (phase !== "authorizing") return;
      settle(
        null,
        new Error(e.nativeEvent.description ?? "WebView auth error"),
      );
    }

    /** Returns true if the URL was the Sony redirect and was handled. */
    function interceptRedirect(url: string): boolean {
      if (!url.startsWith("com.scee.psxandroid.scecompcall://")) return false;
      const code = extractCode(url);
      if (code) {
        settle(code, null);
      } else {
        settle(null, new Error("Auth code missing from Sony redirect URL."));
      }
      return true;
    }

    function extractCode(url: string): string | null {
      return url.match(/[?&]code=([^&]+)/)?.[1]
        ? decodeURIComponent(url.match(/[?&]code=([^&]+)/)![1])
        : null;
    }

    function settle(code: string | null, error: Error | null) {
      // Guard: only settle once per auth attempt
      if (!resolveRef.current && !rejectRef.current) return;
      const resolve = resolveRef.current;
      const reject = rejectRef.current;
      resolveRef.current = null;
      rejectRef.current = null;
      setPhase("idle");

      if (code && resolve) {
        resolve(code);
      } else if (error && reject) {
        reject(error);
      }
    }

    // Only mount the WebView while an auth is in progress.
    // Keeps it out of the tree entirely when idle — avoids the 'about:blank is
    // not a file URL' crash WKWebView throws for non-file blank sources.
    if (phase === "idle") return null;

    return (
      <View style={{ width: 0, height: 0, overflow: "hidden" }}>
        <WebView
          ref={webViewRef}
          source={source as { uri: string }}
          style={{ width: 1, height: 1, opacity: 0 }}
          // Must include the Sony custom scheme so the WebView handles it via
          // onShouldStartLoadWithRequest instead of passing it to Linking.openURL().
          originWhitelist={[
            "https://*",
            "http://*",
            "com.scee.psxandroid.scecompcall://*",
          ]}
          javaScriptEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          onLoadEnd={handleLoadEnd}
          onMessage={handleMessage}
          onError={handleError}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
        />
      </View>
    );
  },
);
