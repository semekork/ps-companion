import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient } from "@tanstack/react-query";
import {
  PersistQueryClientProvider,
  Persister,
} from "@tanstack/react-query-persist-client";
import { Redirect, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import "react-native-reanimated";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import "../global.css";

import { LockScreen } from "@/components/lock-screen";
import { PsSplash } from "@/components/ps-splash";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { UserProvider } from "@/context/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

const _cache = new Map<string, string>();
const CACHE_KEY = "PS_APP_QUERY_CACHE";

const persister: Persister = {
  persistClient: async (client) => {
    _cache.set(CACHE_KEY, JSON.stringify(client));
  },
  restoreClient: async () => {
    const data = _cache.get(CACHE_KEY);
    return data ? JSON.parse(data) : undefined;
  },
  removeClient: async () => {
    _cache.delete(CACHE_KEY);
  },
};

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <AuthProvider>
        <UserProvider>
          <RootNavigator />
        </UserProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const { isAuthenticated, isLoading, biometricEnabled, isUnlocked } =
    useAuth();
  const splashOpacity = useSharedValue(1);

  useEffect(() => {
    if (!isLoading) {
      splashOpacity.value = withTiming(0, { duration: 500 });
    }
  }, [isLoading]);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" options={{ animation: "fade" }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal", headerShown: true }}
        />
      </Stack>

      {/* Redirect based on auth state */}
      {!isLoading && !isAuthenticated && <Redirect href="/welcome" />}

      {/* Splash overlay — fades out once auth resolves */}
      <Animated.View
        style={[StyleSheet.absoluteFill, splashStyle]}
        pointerEvents="none"
      >
        <PsSplash />
      </Animated.View>

      {/* Lock Screen — shown if biometric enabled but not unlocked */}
      {!isLoading &&
        isAuthenticated &&
        biometricEnabled &&
        !isUnlocked &&
        segments[0] !== "welcome" &&
        segments[0] !== "auth" && <LockScreen />}

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
