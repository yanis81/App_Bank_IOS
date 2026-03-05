/**
 * Layout du groupe main (écrans authentifiés).
 * Navigation stack pour le dashboard et les sous-écrans.
 */

import { Stack } from 'expo-router';

import { AppErrorBoundary } from '@/components/shared';
import { colors } from '@/theme/colors';

export { AppErrorBoundary as ErrorBoundary };

export default function MainLayout() {
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
