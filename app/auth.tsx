import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  NpssoWebAuth,
  type NpssoWebAuthRef,
} from "@/components/npsso-web-auth";
import { getPsnAuthorizeUrl, PSN_REDIRECT_URI } from "@/constants/psn";
import { useAuth } from "@/context/auth-context";

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";
const PS_DARKER = "#001A3A";
const NPSSO_URL = "https://ca.account.sony.com/api/v1/ssocookie";
const PSN_LOGIN_URL = "https://www.playstation.com";

export default function AuthScreen() {
  const {
    signIn,
    isLoading,
    error,
    biometricEnabled,
    isUnlocked,
    authenticateBiometric,
    isAuthenticated,
    toggleBiometric,
  } = useAuth();
  const router = useRouter();
  const [npsso, setNpsso] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isWebAuthing, setIsWebAuthing] = useState(false);
  const [showNpssoInput, setShowNpssoInput] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isUnlocked) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isUnlocked]);

  async function handleAutoSignIn() {
    if (busy) return;
    setValidationError(null);

    try {
      setIsWebAuthing(true);
      const authUrl = getPsnAuthorizeUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        PSN_REDIRECT_URI,
      );

      if (result.type === "success") {
        const url = result.url;
        const code = url.match(/[?&]code=([^&]+)/)?.[1];
        if (code) {
          await signIn(decodeURIComponent(code));
          router.replace("/(tabs)");
        } else {
          throw new Error("Auth code missing from Sony redirect.");
        }
      }
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Authentication failed.",
      );
    } finally {
      setIsWebAuthing(false);
    }
  }

  const webAuthRef = useRef<NpssoWebAuthRef>(null);

  const busy = isLoading || isWebAuthing;

  async function handleSignIn(explicitToken?: string | any) {
    const rawToken = typeof explicitToken === "string" ? explicitToken : npsso;
    const token = rawToken.trim();
    if (!token || busy) return;
    setValidationError(null);

    if (token.length !== 64) {
      setValidationError(
        `NPSSO tokens are exactly 64 characters — yours is ${token.length}.`,
      );
      return;
    }

    try {
      setIsWebAuthing(true);
      // Step 1: hidden WebView seeds the NPSSO cookie and captures the
      // auth code from Sony's custom-scheme redirect.
      const code = await webAuthRef.current!.authenticate(token);
      // Step 2: exchange code for access + refresh tokens via context.
      await signIn(code);

      // Navigate to the dashboard now that auth state is set.
      router.replace("/(tabs)");
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Authentication failed.",
      );
    } finally {
      setIsWebAuthing(false);
    }
  }

  const displayError = validationError ?? error;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <LinearGradient
        colors={[PS_DARKER, "#000918", "#000000"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Matching glow blob */}
      <View style={styles.glowBlob} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Image
            source={require("../assets/images/ps-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Connect your account to sync your PlayStation activity
          </Text>
        </View>

        {biometricEnabled && !isUnlocked && (
          <View style={styles.section}>
            <Pressable
              onPress={() => authenticateBiometric()}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryBtnWrapper,
                busy && { opacity: 0.5 },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={[PS_BLUE, PS_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                <Text style={styles.primaryBtnText}>Sign In with FaceID</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* ── OAuth Sign In (new users) ── */}
        {/* ── OAuth Sign In ── */}
        <View style={styles.section}>
          <Pressable
            onPress={handleAutoSignIn}
            disabled={busy}
            style={({ pressed }) => [
              styles.primaryBtnWrapper,
              busy && { opacity: 0.5 },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={[PS_BLUE, PS_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGradient}
            >
              {busy && !isWebAuthing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  Sign In with PlayStation
                </Text>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={styles.helperText}>
            Safe, secure, one-time login via PlayStation Network
          </Text>
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Error message ── */}
        {displayError ? (
          <View
            style={[
              styles.errorBox,
              { marginHorizontal: 20, marginBottom: 16 },
            ]}
          >
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        ) : null}

        {/* ── NPSSO Input ── */}
        {showNpssoInput && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>NPSSO Token (Advanced)</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste your 64-character token"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={npsso}
              onChangeText={setNpsso}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />

            <Pressable
              onPress={handleSignIn}
              disabled={busy || !npsso.trim()}
              style={({ pressed }) => [
                styles.primaryBtnWrapper,
                (busy || !npsso.trim()) && { opacity: 0.4 },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={[PS_BLUE, PS_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                {busy ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Authenticate Token</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* ── Biometric Preference ── */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Lock app with biometrics</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleBiometric}
            trackColor={{ false: "#333", true: PS_BLUE }}
            thumbColor="#fff"
            ios_backgroundColor="#333"
          />
        </View>

        {!showNpssoInput && (
          <Pressable
            onPress={() => setShowNpssoInput(true)}
            className="mx-5 mb-5 active:opacity-70"
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Need help signing in?</Text>
              <Text style={styles.cardSubtext}>
                Use the NPSSO method for manual authentication.
              </Text>
            </View>
          </Pressable>
        )}

        {/* ── Instructions when showing NPSSO ── */}
        {showNpssoInput && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>How to get your NPSSO token</Text>

            <Step number={1}>
              <Text style={styles.stepText}>
                Sign in at{" "}
                <Text
                  style={styles.link}
                  onPress={() => WebBrowser.openBrowserAsync(PSN_LOGIN_URL)}
                >
                  playstation.com
                </Text>{" "}
                in your browser
              </Text>
            </Step>

            <Step number={2}>
              <Text style={styles.stepText}>
                Open the{" "}
                <Text
                  style={styles.link}
                  onPress={() => WebBrowser.openBrowserAsync(NPSSO_URL)}
                >
                  SSO cookie page
                </Text>{" "}
                — it shows a JSON response
              </Text>
            </Step>

            <Step number={3}>
              <Text style={styles.stepText}>
                Copy the 64-character value next to{" "}
                <Text style={styles.mono}>&quot;npsso&quot;</Text> and paste it
                above
              </Text>
            </Step>
          </View>
        )}

        {/* ── Footer note ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your credentials are stored securely on-device using the system
            keychain. They are never sent anywhere except PlayStation Network
            servers.
          </Text>
        </View>
      </ScrollView>

      {/* Hidden WebView handles NPSSO → auth-code exchange for advanced method */}
      <NpssoWebAuth ref={webAuthRef} />
    </KeyboardAvoidingView>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────

function Step({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stepRow}>
      <LinearGradient
        colors={[PS_BLUE, PS_DARK]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.stepBadge}
      >
        <Text style={styles.stepNum}>{number}</Text>
      </LinearGradient>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  glowBlob: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#0055BB",
    opacity: 0.18,
    shadowColor: "#0070D1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },

  header: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  logo: {
    width: 44,
    height: 44,
    marginBottom: 20,
    tintColor: "#fff",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "85%",
  },

  section: {
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },

  primaryBtnWrapper: {
    borderRadius: 8,
    overflow: "hidden",
  },
  primaryBtnGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  helperText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 12,
    textAlign: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginHorizontal: 24,
    marginVertical: 24,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 24,
  },
  toggleLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
    gap: 8,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  cardSubtext: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
  },

  stepRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNum: { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  link: {
    color: "#4DA6FF",
    fontWeight: "500",
  },
  mono: {
    color: "#fff",
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
  },

  inputSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  label: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: -4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
  },

  errorBox: {
    backgroundColor: "rgba(255,59,48,0.15)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
    marginHorizontal: 24,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#FF453A", fontSize: 13 },

  footer: {
    paddingHorizontal: 24,
    marginTop: "auto",
    paddingBottom: 40,
  },
  footerText: {
    color: "#444",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
