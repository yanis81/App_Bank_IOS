/**
 * Composant Card — conteneur avec fond surface et ombres.
 *
 * @module components/ui/Card
 */

import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, shadows } from '@/theme/shared';
import { spacing } from '@/theme/spacing';

type CardVariant = 'default' | 'elevated' | 'outlined';
type CardPadding = 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: ViewStyle;
}

const paddingMap: Record<CardPadding, number> = {
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
  xl: spacing.xl,
};

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.background.card,
    ...shadows.card,
  },
  elevated: {
    backgroundColor: colors.background.elevated,
    ...shadows.elevated,
  },
  outlined: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
};

/**
 * Conteneur card avec fond surface, radius et ombre.
 *
 * @param variant - Style visuel de la card.
 * @param padding - Taille du padding interne.
 * @param onPress - Rend la card pressable si défini.
 */
export function Card({
  children,
  variant = 'default',
  padding = 'lg',
  onPress,
  style,
}: CardProps) {
  const cardStyle: ViewStyle[] = [
    styles.base,
    variantStyles[variant],
    { padding: paddingMap[padding] },
    ...(style ? [style] : []),
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
  },
});
