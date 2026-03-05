/**
 * Composant Skeleton pour les effets de chargement shimmer.
 * Remplace les spinners par une animation de placeholder.
 *
 * @module components/ui/Skeleton
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius as themeRadius } from '@/theme/shared';
import { spacing } from '@/theme/spacing';

interface SkeletonProps {
  /** Largeur du skeleton (nombre ou pourcentage). */
  width?: number | `${number}%`;
  /** Hauteur du skeleton. */
  height?: number;
  /** Radius du skeleton. */
  borderRadius?: number;
  /** Style additionnel. */
  style?: ViewStyle;
}

/**
 * Bloc skeleton individuel avec animation shimmer.
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = themeRadius.sm,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

/**
 * Skeleton card simulant une carte de solde bancaire.
 */
export function SkeletonBalanceCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={12} />
      </View>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.cardRow}>
          <Skeleton width="50%" height={16} />
          <Skeleton width={80} height={20} />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton simulant une liste de cartes d'action.
 */
export function SkeletonActionList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.actionList}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.actionItem}>
          <Skeleton width={40} height={40} borderRadius={themeRadius.md} />
          <View style={styles.actionContent}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.background.tertiary,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: themeRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  actionList: {
    gap: spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: themeRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.md,
  },
  actionContent: {
    flex: 1,
    gap: spacing.xs,
  },
});
