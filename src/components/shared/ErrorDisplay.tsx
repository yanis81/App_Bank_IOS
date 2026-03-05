/**
 * Composant ErrorDisplay — affichage d'erreur avec bouton réessayer.
 *
 * @module components/shared/ErrorDisplay
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Typography } from '@/components/ui';
import { spacing } from '@/theme/spacing';

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Bloc d'affichage d'erreur avec message et bouton de réessai.
 *
 * @param message - Message d'erreur affiché à l'utilisateur.
 * @param onRetry - Callback du bouton réessayer.
 * @param retryLabel - Libellé personnalisé du bouton (défaut: "Réessayer").
 */
export function ErrorDisplay({
  message,
  onRetry,
  retryLabel = 'Réessayer',
}: ErrorDisplayProps) {
  return (
    <View style={styles.container}>
      <Typography variant="h2" align="center">
        😕
      </Typography>
      <Typography variant="h3" align="center" style={styles.title}>
        Une erreur est survenue
      </Typography>
      <Typography variant="body" color="secondary" align="center" style={styles.message}>
        {message}
      </Typography>
      {onRetry ? (
        <Button
          title={retryLabel}
          onPress={onRetry}
          variant="outline"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  title: {
    marginTop: spacing.lg,
  },
  message: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing['2xl'],
  },
});
