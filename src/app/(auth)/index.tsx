/**
 * Écran Splash — Premier écran affiché au lancement.
 * Affiche le logo et redirige vers l'onboarding ou le login.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding/intro');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.emoji}>💳</Text>
        <Text style={styles.title}>Wallet Balance</Text>
        <Text style={styles.subtitle}>Assistant</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.h3,
    color: colors.accent.primary,
  },
});
