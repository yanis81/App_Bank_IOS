/**
 * Root Layout — Point d'entrée de la navigation Expo Router.
 * Initialise Clerk, gère le splash screen et le routage auth/main.
 */

import { useEffect, useState } from 'react';

import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';

import { OfflineBanner, ToastContainer } from '@/components/shared';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useNetworkStore } from '@/stores/network-store';
import { env } from '@/core/config/env';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

const publishableKey = env.CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Ajoutez EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY dans le fichier .env');
}

/**
 * Layout interne qui gère la navigation en fonction de l'état Clerk.
 */
function RootLayoutNav() {
  const [fontsLoaded] = useFonts({});
  const router = useRouter();
  const segments = useSegments();

  const { isSignedIn, isLoaded } = useAuth();
  const initializeNetwork = useNetworkStore((s) => s.initialize);
  const { isEnabled: biometricEnabled, authenticate, isLoading: biometricLoading } = useBiometricAuth();
  const [biometricPassed, setBiometricPassed] = useState(false);

  useEffect(() => {
    const unsubscribe = initializeNetwork();
    return unsubscribe;
  }, [initializeNetwork]);

  useEffect(() => {
    if (!isLoaded || biometricLoading) return;

    if (isSignedIn && biometricEnabled && !biometricPassed) {
      authenticate().then((success) => {
        setBiometricPassed(success);
      });
    } else {
      setBiometricPassed(true);
    }
  }, [isLoaded, isSignedIn, biometricEnabled, biometricLoading, biometricPassed, authenticate]);

  useEffect(() => {
    if (!isLoaded || !fontsLoaded || !biometricPassed) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [isSignedIn, isLoaded, fontsLoaded, biometricPassed, segments, router]);

  if (!isLoaded || !fontsLoaded || !biometricPassed) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <OfflineBanner />
      <ToastContainer />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootLayoutNav />
    </ClerkProvider>
  );
}
