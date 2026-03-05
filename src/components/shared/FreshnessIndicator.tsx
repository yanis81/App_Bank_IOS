/**
 * Indicateur de fraîcheur des données.
 * Affiche un badge coloré selon l'ancienneté des données.
 *
 * - Vert : < 30 min
 * - Orange : < 2h
 * - Rouge : > 2h
 *
 * @module components/shared/FreshnessIndicator
 */

import { View, Text, StyleSheet } from 'react-native';

import { formatTimeAgo } from '@/core/utils/format-currency';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

interface FreshnessIndicatorProps {
  /** ISO 8601 date de la dernière mise à jour. */
  lastUpdated: string;
}

/**
 * Détermine la couleur de l'indicateur selon l'ancienneté.
 */
function getFreshnessColor(lastUpdated: string): string {
  const diffMs = Date.now() - new Date(lastUpdated).getTime();
  const diffMinutes = diffMs / (1000 * 60);

  if (diffMinutes < 30) return colors.semantic.success;
  if (diffMinutes < 120) return colors.semantic.warning;
  return colors.semantic.error;
}

/**
 * Badge de fraîcheur avec couleur adaptative et texte "il y a X min".
 */
export function FreshnessIndicator({ lastUpdated }: FreshnessIndicatorProps) {
  const color = getFreshnessColor(lastUpdated);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.text}>maj {formatTimeAgo(lastUpdated)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  text: {
    ...typography.small,
    color: colors.text.tertiary,
  },
});
