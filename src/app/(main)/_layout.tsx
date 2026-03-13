/**
 * Layout du groupe main (écrans authentifiés).
 * Redirige vers le login si l'utilisateur n'est pas connecté via Clerk.
 * Déclenche le warm-up serveur dès l'entrée dans la zone authentifiée.
 */

import { useEffect } from 'react';

import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

import { AppErrorBoundary } from '@/components/shared';
import { useWarmupStore } from '@/stores/warmup-store';
import { colors } from '@/theme/colors';

export { AppErrorBoundary as ErrorBoundary };

export default function MainLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const startWarmup = useWarmupStore((s) => s.startWarmup);

  useEffect(() => {
    startWarmup();
  }, [startWarmup]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background.primary },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="bank-connection" />
      <Stack.Screen name="bank-callback" />
      <Stack.Screen name="account-selection" />
      <Stack.Screen name="card-mapping" />
      <Stack.Screen name="notification-permission" />
      <Stack.Screen name="automation-guide" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
