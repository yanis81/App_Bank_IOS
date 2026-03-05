/**
 * Composant AccountListItem — ligne de compte bancaire dans une liste.
 *
 * @module components/shared/AccountListItem
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import { formatCurrency } from '@/core/utils/format-currency';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/shared';
import { spacing } from '@/theme/spacing';

interface AccountListItemProps {
  label: string;
  maskedIban?: string | null;
  balance?: number;
  currency?: string;
  isSelected?: boolean;
  onPress?: () => void;
}

/**
 * Item de liste pour un compte bancaire avec label, IBAN masqué et solde.
 *
 * @param label - Nom du compte.
 * @param maskedIban - IBAN partiellement masqué.
 * @param isSelected - Indique si l'item est sélectionné.
 */
export function AccountListItem({
  label,
  maskedIban,
  balance,
  currency = 'EUR',
  isSelected = false,
  onPress,
}: AccountListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={({ pressed }) => [
        styles.container,
        isSelected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <Typography variant="bodyBold" color="primary">
          {label}
        </Typography>
        {maskedIban ? (
          <Typography variant="small" color="tertiary">
            {maskedIban}
          </Typography>
        ) : null}
      </View>
      {balance !== undefined && (
        <Typography variant="amountSmall" color="primary">
          {formatCurrency(balance, currency)}
        </Typography>
      )}
      {isSelected && (
        <View style={styles.checkmark}>
          <Typography variant="body" color="accent">✓</Typography>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    minHeight: 64,
  },
  selected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.background.elevated,
  },
  pressed: {
    opacity: 0.8,
  },
  left: {
    flex: 1,
    gap: spacing.xxs,
  },
  checkmark: {
    marginLeft: spacing.md,
  },
});
