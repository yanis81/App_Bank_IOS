/**
 * Composant BalanceCard — affiche le solde d'un compte bancaire.
 *
 * @module components/shared/BalanceCard
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Typography } from '@/components/ui';
import { formatCurrency, formatTimeAgo } from '@/core/utils/format-currency';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface BalanceCardProps {
  label: string;
  amount: number;
  currency?: string;
  lastUpdated?: string;
  isPrimary?: boolean;
  onPress?: () => void;
}

/**
 * Carte de solde bancaire avec label, montant formaté et timestamp.
 *
 * @param label - Nom du compte (ex: "Compte courant").
 * @param amount - Montant du solde.
 * @param isPrimary - Affiche la carte en style élevé si principal.
 */
export function BalanceCard({
  label,
  amount,
  currency = 'EUR',
  lastUpdated,
  isPrimary = false,
  onPress,
}: BalanceCardProps) {
  return (
    <Card
      variant={isPrimary ? 'elevated' : 'default'}
      padding="lg"
      onPress={onPress}
    >
      <View style={styles.header}>
        <Typography variant="caption" color="secondary">
          {label}
        </Typography>
        {isPrimary && (
          <View style={styles.primaryBadge}>
            <Typography variant="small" color="accent">
              Principal
            </Typography>
          </View>
        )}
      </View>
      <Typography variant={isPrimary ? 'amount' : 'amountSmall'} color="primary">
        {formatCurrency(amount, currency)}
      </Typography>
      {lastUpdated ? (
        <Typography variant="small" color="tertiary" style={styles.timestamp}>
          maj {formatTimeAgo(lastUpdated)}
        </Typography>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  primaryBadge: {
    backgroundColor: `${colors.accent.primary}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 9999,
  },
  timestamp: {
    marginTop: spacing.xs,
  },
});
