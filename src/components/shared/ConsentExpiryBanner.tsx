/**
 * Composant ConsentExpiryBanner — alerte re-consentement GoCardless.
 * Affiché quand une connexion bancaire expire bientôt ou est expirée.
 *
 * @module components/shared/ConsentExpiryBanner
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/shared';
import { spacing } from '@/theme/spacing';
import type { BankConnection } from '@/domain/entities';
import { daysUntilExpiration } from '@/domain/entities';

interface ConsentExpiryBannerProps {
  connection: BankConnection;
  onRenew: (connectionId: string) => void;
}

/**
 * Bannière d'alerte affichée quand le consentement bancaire est expiré ou bientôt expiré.
 * Propose un bouton pour renouveler l'accès.
 *
 * @param connection - Connexion bancaire concernée.
 * @param onRenew - Callback pour renouveler le consentement.
 */
export function ConsentExpiryBanner({ connection, onRenew }: ConsentExpiryBannerProps) {
  const isExpired = connection.status === 'expired' || connection.status === 'revoked';
  const days = daysUntilExpiration(connection);

  const getMessage = (): string => {
    if (isExpired) return 'Votre accès bancaire a expiré. Renouvelez-le pour continuer.';
    if (days !== null && days <= 3) return `Votre accès bancaire expire dans ${days} jour${days > 1 ? 's' : ''}.`;
    if (days !== null && days <= 7) return `Votre accès bancaire expire dans ${days} jours.`;
    return 'Votre accès bancaire expire bientôt.';
  };

  return (
    <View style={[styles.container, isExpired ? styles.expired : styles.warning]}>
      <View style={styles.content}>
        <Typography variant="caption" color={isExpired ? 'error' : 'warning'}>
          {isExpired ? '🔴' : '⚠️'} {getMessage()}
        </Typography>
      </View>
      <Pressable
        style={[styles.button, isExpired ? styles.buttonExpired : styles.buttonWarning]}
        onPress={() => onRenew(connection.id)}
        accessibilityLabel="Renouveler l'accès bancaire"
      >
        <Typography variant="small" color="primary">
          Renouveler
        </Typography>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
  },
  warning: {
    backgroundColor: `${colors.semantic.warning}15`,
    borderColor: `${colors.semantic.warning}40`,
  },
  expired: {
    backgroundColor: `${colors.semantic.error}15`,
    borderColor: `${colors.semantic.error}40`,
  },
  content: {
    flex: 1,
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  buttonWarning: {
    backgroundColor: colors.semantic.warning,
  },
  buttonExpired: {
    backgroundColor: colors.semantic.error,
  },
});
