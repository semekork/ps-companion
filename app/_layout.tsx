import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Redirect, Stack } from "expo-router";
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

// In-memory storage — avoids native AsyncStorage module issues with Expo Go.
// Keeps the cache alive for the session; data refetches on a fresh app launch.
const _cache = new Map<string, string>();
const memoryStorage = {
  getItem: (key: string) => Promise.resolve(_cache.get(key) ?? null),
  setItem: (key: string, value: string) => {
    _cache.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    _cache.delete(key);
    return Promise.resolve();
  },
};

const persister = createAsyncStoragePersister({
  storage: memoryStorage,
  key: "PS_APP_QUERY_CACHE",
});

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
  const { isAuthenticated, isLoading } = useAuth();
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
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="welcome"
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="auth"
          options={{ headerShown: false, animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="game/[titleId]"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="friend/[accountId]"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            gestureDirection: "horizontal",
          }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
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

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
