/**
 * Layout du groupe auth (écrans non authentifiés).
 * Gère le splash, l'onboarding et la connexion.
 */

import { Stack } from 'expo-router';

import { AppErrorBoundary } from '@/components/shared';
import { colors } from '@/theme/colors';

export { AppErrorBoundary as ErrorBoundary };

export default function AuthLayout() {
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
    </Stack>
  );
}
