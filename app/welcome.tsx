import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";
const PS_DARKER = "#001A3A";

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* ── Full-bleed gradient background ── */}
      <LinearGradient
        colors={[PS_DARKER, "#000918", "#000000"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Decorative glow blob (top-right) ── */}
      <Animated.View
        entering={FadeIn.duration(1200)}
        style={styles.glowBlob}
        pointerEvents="none"
      />

      {/* ── Decorative game art tiles ── */}
      <Animated.View
        entering={FadeIn.duration(1000).delay(200)}
        style={[styles.tilesWrap, { top: insets.top + 32 }]}
        pointerEvents="none"
      >
        {/* Row 1 */}
        <View style={styles.tilesRow}>
          {TILE_COLORS.slice(0, 3).map((c, i) => (
            <View
              key={i}
              style={[styles.tile, styles.tileLg, { backgroundColor: c }]}
            >
              <View style={[styles.tileShine, { opacity: 0.12 }]} />
            </View>
          ))}
        </View>
        {/* Row 2 — offset */}
        <View style={[styles.tilesRow, { marginLeft: -38, marginTop: 10 }]}>
          {TILE_COLORS.slice(3, 7).map((c, i) => (
            <View
              key={i}
              style={[styles.tile, styles.tileMd, { backgroundColor: c }]}
            >
              <View style={[styles.tileShine, { opacity: 0.1 }]} />
            </View>
          ))}
        </View>
        {/* Fade out tiles toward bottom */}
        <LinearGradient
          colors={["transparent", "#000918", "#000000"]}
          locations={[0, 0.6, 1]}
          style={styles.tilesFade}
        />
      </Animated.View>

      {/* ── Bottom content area ── */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 36 }]}>
        {/* PS logo */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(300).springify().damping(18)}
          style={styles.logoWrap}
        >
          <LinearGradient
            colors={[PS_BLUE, PS_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Image
              source={require("../assets/images/ps-logo.png")}
              style={styles.logo}
            />
          </LinearGradient>
          <Text style={styles.wordmark}>Companion</Text>
        </Animated.View>

        {/* Headline */}
        <Animated.Text
          entering={FadeInDown.duration(550).delay(420).springify().damping(18)}
          style={styles.headline}
        >
          Play Has{"\n"}No Limits.
        </Animated.Text>

        {/* Subtext */}
        <Animated.Text
          entering={FadeInDown.duration(500).delay(520).springify().damping(18)}
          style={styles.subtext}
        >
          Track your trophies, stay connected with{"\n"}friends, and never miss
          a moment.
        </Animated.Text>

        {/* CTA */}
        <Animated.View
          entering={FadeInDown.duration(480).delay(620).springify().damping(18)}
          style={styles.ctaWrap}
        >
          <Pressable
            onPress={() => router.push("/auth")}
            style={({ pressed }) => [
              styles.loginBtn,
              pressed && { opacity: 0.88, transform: [{ scale: 0.978 }] },
            ]}
          >
            <LinearGradient
              colors={[PS_BLUE, PS_DARK]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtnGradient}
            >
              <Text style={styles.loginBtnText}>Login Now</Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.termsText}>
            By continuing you agree to the{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

// Decorative tile colour palette — muted game-art inspired hues
const TILE_COLORS = [
  "#1B3A6B",
  "#0D2E5C",
  "#2A1F6B",
  "#123068",
  "#1A406E",
  "#0E3B72",
  "#1D2E70",
];

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Decorative glow
  glowBlob: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#0055BB",
    opacity: 0.22,
    // Soft blur via shadow (iOS)
    shadowColor: "#0070D1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },

  // Tile grid
  tilesWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    gap: 10,
  },
  tilesRow: {
    flexDirection: "row",
    gap: 10,
  },
  tile: {
    borderRadius: 14,
    overflow: "hidden",
  },
  tileLg: { flex: 1, height: 120 },
  tileMd: { flex: 1, height: 88 },
  tileShine: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
  },
  tilesFade: {
    position: "absolute",
    bottom: -2,
    left: 0,
    right: 0,
    height: 120,
  },

  // Bottom content
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
  },

  // Logo
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 44,
    height: 22,
  },
  logoText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: -0.5,
  },
  wordmark: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // Text
  headline: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.2,
    lineHeight: 50,
    marginBottom: 14,
  },
  subtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 36,
  },

  // CTA
  ctaWrap: { gap: 16 },
  loginBtn: {
    borderRadius: 16,
    overflow: "hidden",
  },
  loginBtnGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  termsText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    textAlign: "center",
  },
  termsLink: {
    color: "rgba(255,255,255,0.55)",
    textDecorationLine: "underline",
  },
});
