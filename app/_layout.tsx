import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { usePartnersStore } from "@/store/partners.store";
import { useSessionStore } from "@/store/session.store";
import { useMoodStore } from "@/store/mood.store";
import { useInsightsStore } from "@/store/insights.store";
import { useMomentsStore } from "@/store/moments.store";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * Hydrates all Zustand stores from AsyncStorage, then redirects to onboarding
 * if setup is not complete. Navigation only happens AFTER the root layout
 * has fully mounted (guarded by a mounted ref + setTimeout).
 */
function StoreHydrator() {
  const router = useRouter();
  const segments = useSegments();

  const hydratePartners = usePartnersStore((s) => s.hydrate);
  const hydrateSession = useSessionStore((s) => s.hydrateHistory);
  const hydrateMood = useMoodStore((s) => s.hydrate);
  const hydrateInsights = useInsightsStore((s) => s.hydrate);
  const hydrateMoments = useMomentsStore((s) => s.hydrate);
  const isSetupComplete = usePartnersStore((s) => s.isSetupComplete);

  const [hydrated, setHydrated] = useState(false);

  // Step 1: hydrate all stores
  useEffect(() => {
    Promise.all([
      hydratePartners(),
      hydrateSession(),
      hydrateMood(),
      hydrateInsights(),
      hydrateMoments(),
    ])
      .catch(() => {})
      .finally(() => setHydrated(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: once hydrated, redirect if needed — deferred so Root Layout is mounted
  useEffect(() => {
    if (!hydrated) return;

    // Include 'oauth' so the OAuth callback is never interrupted by the setup redirect
    const inAuthGroup =
      segments[0] === 'onboarding' ||
      segments[0] === 'setup' ||
      segments[0] === 'pair' ||
      segments[0] === 'oauth';

    if (!isSetupComplete && !inAuthGroup) {
      // Defer navigation until after the current render cycle completes
      const timer = setTimeout(() => {
        router.replace('/onboarding');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hydrated, isSetupComplete, segments, router]);

  return null;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <StoreHydrator />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
            <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="setup" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="pair" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="session-start" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="session" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="session-end" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="daily" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="mood" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="insights" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="timeline" options={{ animation: 'slide_from_right' }} />
          </Stack>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
