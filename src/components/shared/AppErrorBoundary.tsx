/**
 * ErrorBoundary global pour les routes Expo Router.
 * Attrape les erreurs React non gérées et affiche un écran de récupération.
 *
 * @module components/shared/AppErrorBoundary
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';

import type { ErrorBoundaryProps } from 'expo-router';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

/**
 * Composant ErrorBoundary compatible avec Expo Router.
 * Exporter depuis un fichier de route pour capturer les erreurs de ce segment.
 *
 * @param error - L'erreur capturée.
 * @param retry - Fonction pour relancer le rendu.
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>Oups, une erreur est survenue</Text>
      <Text style={styles.message}>
        {error.message || 'Une erreur inattendue s\'est produite.'}
      </Text>
      <Pressable
        style={styles.retryButton}
        onPress={retry}
        accessibilityLabel="Réessayer"
        accessibilityRole="button"
      >
        <Text style={styles.retryText}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['3xl'],
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  retryText: {
    ...typography.button,
    color: colors.text.primary,
  },
});
