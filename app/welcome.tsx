import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PS_BLUE = "#0070D1";
const PS_DARK = "#00439C";
const PS_DARKER = "#001A3A";

function FloatingColumn({
  children,
  delay = 0,
  offset = 10,
  duration = 4000,
  style,
}: any) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      translateY.value = withRepeat(
        withSequence(
          withTiming(offset, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(-offset, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    };
    const timer = setTimeout(startAnimation, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
}

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

      {/* ── Background Grid ── */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.8 }]}>
        <View style={styles.grid}>
          <FloatingColumn
            style={styles.gridCol}
            offset={12}
            duration={5000}
            delay={0}
          >
            {GAME_TILES.slice(0, 2).map((item, i) => (
              <Animated.View
                key={i}
                entering={FadeIn.duration(800).delay(i * 100)}
                style={[
                  styles.gridItem,
                  i === 0 ? styles.itemTall : styles.itemShort,
                ]}
              >
                <Image
                  source={{ uri: item.url }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              </Animated.View>
            ))}
          </FloatingColumn>
          <FloatingColumn
            style={styles.gridCol}
            offset={-15}
            duration={6000}
            delay={200}
          >
            {GAME_TILES.slice(2, 4).map((item, i) => (
              <Animated.View
                key={i}
                entering={FadeIn.duration(800).delay(200 + i * 100)}
                style={[
                  styles.gridItem,
                  i === 0 ? styles.itemShort : styles.itemTall,
                ]}
              >
                <Image
                  source={{ uri: item.url }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              </Animated.View>
            ))}
          </FloatingColumn>
          <FloatingColumn
            style={styles.gridCol}
            offset={10}
            duration={4500}
            delay={400}
          >
            {GAME_TILES.slice(4, 6).map((item, i) => (
              <Animated.View
                key={i}
                entering={FadeIn.duration(800).delay(400 + i * 100)}
                style={[
                  styles.gridItem,
                  i === 0 ? styles.itemTall : styles.itemShort,
                ]}
              >
                <Image
                  source={{ uri: item.url }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              </Animated.View>
            ))}
          </FloatingColumn>
        </View>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)", "#000000", "#000000"]}
          locations={[0, 0.4, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* ── Bottom content area ── */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.content}>
          {/* PS logo */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(200).springify().damping(20)}
            style={styles.logoWrap}
          >
            <View style={styles.logoBox}>
              <Image
                source={require("../assets/images/ps-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.wordmark}>Companion</Text>
          </Animated.View>

          {/* Headline */}
          <Animated.Text
            entering={FadeInDown.duration(500)
              .delay(300)
              .springify()
              .damping(20)}
            style={styles.headline}
          >
            Play Has{"\n"}No Limits.
          </Animated.Text>

          {/* Subtext */}
          <Animated.Text
            entering={FadeInDown.duration(500)
              .delay(400)
              .springify()
              .damping(20)}
            style={styles.subtext}
          >
            Track your trophies, stay connected with{"\n"}friends, and never
            miss a moment.
          </Animated.Text>

          {/* CTA */}
          <Animated.View
            entering={FadeInDown.duration(500)
              .delay(500)
              .springify()
              .damping(20)}
            style={styles.ctaWrap}
          >
            <Pressable
              onPress={() => router.push("/auth")}
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient
                colors={[PS_BLUE, PS_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                <Text style={styles.loginBtnText}>Continue to Login</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.termsText}>
              By continuing you agree to the{" "}
              <Text style={styles.termsLink}>Terms of Service</Text>
            </Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

// Actual PlayStation Game Covers mapped
const GAME_TILES = [
  {
    url: "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/1c7b75d8ed9271516546560d219ad0b22ee0a263b4537bd8.png",
  }, // Spiderman
  {
    url: "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png",
  }, // God of War
  {
    url: "https://image.api.playstation.com/vulcan/ap/rnd/202010/2915/kifM3lnke5lExwRd96mIDojQ.png",
  }, // Ghost of Tsushima
  {
    url: "https://image.api.playstation.com/vulcan/ap/rnd/202405/2210/4126b58375cb32a51dfdbfde8637daae8b971c3b10c3bc80.jpg",
  }, // Helldivers
  {
    url: "https://image.api.playstation.com/gs2-sec/appkgo/prod/CUSA01433_00/7/i_5c5e430a49994f22df5fd81f446ead7b6ae45027af490b415fe4e744a9918e4c/i/icon0.png",
  }, // Horizon
  {
    url: "https://image.api.playstation.com/vulcan/ap/rnd/202208/2505/DE9sevLlnfHm7vLrRwDFEZpO.png",
  }, // Last of Us
  {
    url: "https://image.api.playstation.com/vulcan/img/rnd/202010/2618/w48z6bzefZPrRcJHc7L8SO66.png",
  }, // Final Fantasy
];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  // Background Grid
  grid: {
    flexDirection: "row",
    padding: 8,
    gap: 8,
    paddingTop: 48,
  },
  gridCol: {
    flex: 1,
    gap: 8,
  },
  gridItem: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  itemTall: { height: 220 },
  itemShort: { height: 160 },

  // Bottom content
  bottom: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  content: {
    gap: 4,
  },

  // Logo
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 24,
    height: 18,
    tintColor: "#000",
  },
  wordmark: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.5,
  },

  // Typography
  headline: {
    color: "#fff",
    fontSize: 44,
    fontWeight: "700",
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: 12,
  },
  subtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },

  // Form & Actions
  ctaWrap: { gap: 16 },
  loginBtn: {
    borderRadius: 8,
    overflow: "hidden",
  },
  loginBtnGradient: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  termsText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    textAlign: "center",
  },
  termsLink: {
    color: "rgba(255,255,255,0.8)",
  },
});
