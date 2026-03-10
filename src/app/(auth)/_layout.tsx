/**
 * Layout du groupe auth (écrans non authentifiés).
 * Redirige vers le dashboard si l'utilisateur est déjà connecté via Clerk.
 */

import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

import { AppErrorBoundary } from '@/components/shared';
import { colors } from '@/theme/colors';

export { AppErrorBoundary as ErrorBoundary };

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return <Redirect href="/(main)" />;
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
      <Stack.Screen name="onboarding/intro" />
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
