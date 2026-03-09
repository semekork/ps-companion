import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";

import {
  NpssoWebAuth,
  type NpssoWebAuthRef,
} from "@/components/npsso-web-auth";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/auth-context";

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";
const PS_DARKER = "#001A3A";
const NPSSO_URL = "https://ca.account.sony.com/api/v1/ssocookie";
const PSN_LOGIN_URL = "https://www.playstation.com";

export default function AuthScreen() {
  const { signIn, isLoading, error } = useAuth();
  const router = useRouter();
  const [npsso, setNpsso] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isWebAuthing, setIsWebAuthing] = useState(false);
  const webAuthRef = useRef<NpssoWebAuthRef>(null);

  const busy = isLoading || isWebAuthing;

  async function handleSignIn() {
    const token = npsso.trim();
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
      {/* Same gradient as welcome screen */}
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
          <LinearGradient
            colors={[PS_BLUE, PS_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoText}>PS</Text>
          </LinearGradient>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Connect to your PlayStation Network account
          </Text>
        </View>

        {/* ── Instructions card ── */}
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
              below
            </Text>
          </Step>
        </View>

        {/* ── Input ── */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>NPSSO Token</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste your 64-character NPSSO token"
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={npsso}
            onChangeText={setNpsso}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            secureTextEntry={false}
            multiline={false}
            returnKeyType="done"
            onSubmitEditing={handleSignIn}
          />

          {displayError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSignIn}
            disabled={busy || !npsso.trim()}
            style={({ pressed }) => [
              styles.signInBtn,
              (busy || !npsso.trim()) && { opacity: 0.4 },
              pressed && { opacity: 0.88, transform: [{ scale: 0.978 }] },
            ]}
          >
            <LinearGradient
              colors={[PS_BLUE, PS_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signInBtnGradient}
            >
              {busy ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.signInBtnText}>Sign In</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* ── Footer note ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your NPSSO token is stored securely on-device using the system
            keychain. It is never sent anywhere except PlayStation Network
            servers.
          </Text>
        </View>
      </ScrollView>

      {/* Hidden WebView handles NPSSO → auth-code exchange */}
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
    paddingTop: 72,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
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
    textDecorationLine: "underline",
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
    marginHorizontal: 20,
    gap: 12,
  },
  inputLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: "Courier New",
      android: "monospace",
      default: "monospace",
    }),
  },

  errorBox: {
    backgroundColor: "rgba(255,59,48,0.15)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,59,48,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: { color: "#FF453A", fontSize: 13, lineHeight: 18 },

  signInBtn: { borderRadius: 16, overflow: "hidden" },
  signInBtnGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  signInBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  footer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
