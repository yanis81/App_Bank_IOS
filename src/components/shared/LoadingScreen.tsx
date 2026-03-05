/**
 * Composant LoadingScreen — écran de chargement plein écran.
 *
 * @module components/shared/LoadingScreen
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Écran de chargement avec spinner centré et message optionnel.
 *
 * @param message - Texte affiché sous le spinner.
 */
export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent.primary} />
      {message ? (
        <Typography variant="body" color="secondary" style={styles.text}>
          {message}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    gap: spacing.lg,
  },
  text: {
    marginTop: spacing.sm,
  },
});
