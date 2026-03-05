/**
 * Composant Badge — indicateur compact (statut, compteur).
 *
 * @module components/ui/Badge
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/shared';
import { spacing } from '@/theme/spacing';
import { Typography } from './Typography';

import { View } from 'react-native';

type BadgeVariant = 'info' | 'success' | 'warning' | 'error';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, ViewStyle> = {
  info: { backgroundColor: `${colors.semantic.info}20` },
  success: { backgroundColor: `${colors.semantic.success}20` },
  warning: { backgroundColor: `${colors.semantic.warning}20` },
  error: { backgroundColor: `${colors.semantic.error}20` },
};

const variantTextColor: Record<BadgeVariant, 'accent' | 'success' | 'warning' | 'error'> = {
  info: 'accent',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

/**
 * Badge compact pour afficher un statut ou une information.
 *
 * @param label - Texte du badge.
 * @param variant - Variante sémantique (info, success, warning, error).
 * @param size - Taille du badge (sm ou md).
 */
export function Badge({ label, variant = 'info', size = 'md' }: BadgeProps) {
  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        size === 'sm' ? styles.sm : styles.md,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Typography
        variant={size === 'sm' ? 'small' : 'caption'}
        color={variantTextColor[variant]}
      >
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
