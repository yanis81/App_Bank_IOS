/**
 * Composant EmptyState — état vide avec icône, message et CTA.
 *
 * @module components/shared/EmptyState
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Typography } from '@/components/ui';
import { spacing } from '@/theme/spacing';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Affiche un état vide centré avec icône emoji, titre, description et bouton d'action optionnel.
 *
 * @param icon - Emoji affiché en grand.
 * @param title - Titre de l'état vide.
 * @param description - Description explicative.
 * @param actionLabel - Libellé du bouton d'action (optionnel).
 * @param onAction - Callback du bouton d'action (optionnel).
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Typography variant="h1" align="center">
        {icon}
      </Typography>
      <Typography variant="h3" align="center" style={styles.title}>
        {title}
      </Typography>
      <Typography variant="body" color="secondary" align="center" style={styles.description}>
        {description}
      </Typography>
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
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
  description: {
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing['2xl'],
  },
});
