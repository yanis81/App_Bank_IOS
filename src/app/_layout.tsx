/**
 * Root Layout — Point d'entrée de la navigation Expo Router.
 * Initialise la session, gère le splash screen et le routage auth/main.
 */

import { useEffect, useState } from 'react';

import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { OfflineBanner, ToastContainer } from '@/components/shared';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useAuthStore } from '@/stores/auth-store';
import { useNetworkStore } from '@/stores/network-store';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});
  const router = useRouter();
  const segments = useSegments();

  const { user, isInitialized, initialize } = useAuthStore();
  const initializeNetwork = useNetworkStore((s) => s.initialize);
  const { isEnabled: biometricEnabled, authenticate, isLoading: biometricLoading } = useBiometricAuth();
  const [biometricPassed, setBiometricPassed] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const unsubscribe = initializeNetwork();
    return unsubscribe;
  }, [initializeNetwork]);

  useEffect(() => {
    if (!isInitialized || biometricLoading) return;

    if (user && biometricEnabled && !biometricPassed) {
      authenticate().then((success) => {
        setBiometricPassed(success);
      });
    } else {
      setBiometricPassed(true);
    }
  }, [isInitialized, user, biometricEnabled, biometricLoading, biometricPassed, authenticate]);

  useEffect(() => {
    if (!isInitialized || !fontsLoaded || !biometricPassed) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (user && inAuthGroup) {
      router.replace('/(main)');
    }
  }, [user, isInitialized, fontsLoaded, biometricPassed, segments, router]);

  if (!isInitialized || !fontsLoaded || !biometricPassed) {
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
