/**
 * Écran de permission des notifications.
 * Demande l'autorisation d'envoyer des notifications locales.
 */

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { logger } from '@/core/logger';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

export default function NotificationPermissionScreen() {
  const router = useRouter();
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);

      if (granted) {
        logger.info('Permissions notifications accordées');
        router.replace('/(main)/automation-guide');
      } else {
        logger.warn('Permissions notifications refusées');
      }
    } catch (error: unknown) {
      logger.error('Erreur demande permissions', { error: String(error) });
    }
  }, [router]);

  const handleSkip = useCallback(() => {
    router.replace('/(main)');
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.description}>
          Autorisez les notifications pour afficher vos soldes bancaires
          avant et après chaque paiement Apple Pay.
        </Text>

        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>💳 Soldes (maj 5 min)</Text>
          <Text style={styles.previewBody}>
            • Compte courant : 1 234,56 €{'\n'}
            • Livret A : 5 678,90 €
          </Text>
        </View>

        {permissionGranted ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅ Notifications activées !</Text>
          </View>
        ) : null}

        <Pressable
          style={styles.allowButton}
          onPress={requestPermission}
          accessibilityLabel="Autoriser les notifications"
        >
          <Text style={styles.allowButtonText}>Autoriser les notifications</Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Plus tard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  previewCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  previewTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  previewBody: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: radius.sm,
    padding: spacing.md,
    alignSelf: 'stretch',
  },
  successText: {
    ...typography.bodyBold,
    color: colors.semantic.success,
    textAlign: 'center',
  },
  allowButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  allowButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  skipButton: {
    padding: spacing.sm,
  },
  skipText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});
