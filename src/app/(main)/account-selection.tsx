/**
 * Écran de sélection des comptes principaux et secondaires.
 * L'utilisateur choisit son compte principal + 2 secondaires max.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useBankStore } from '@/stores/bank-store';
import { MAX_NOTIFICATION_ACCOUNTS } from '@/core/config/constants';
import type { BankAccount } from '@/domain/entities';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

export default function AccountSelectionScreen() {
  const router = useRouter();
  const {
    accounts,
    notificationSettings,
    isLoading,
    fetchAccounts,
    fetchSettings,
    saveSettings,
  } = useBankStore();

  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [secondaryIds, setSecondaryIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchSettings();
  }, [fetchAccounts, fetchSettings]);

  useEffect(() => {
    if (notificationSettings) {
      setPrimaryId(notificationSettings.primaryAccountId);
      const secs: string[] = [];
      if (notificationSettings.secondaryAccount1Id) secs.push(notificationSettings.secondaryAccount1Id);
      if (notificationSettings.secondaryAccount2Id) secs.push(notificationSettings.secondaryAccount2Id);
      setSecondaryIds(secs);
    }
  }, [notificationSettings]);

  const handleAccountPress = useCallback((account: BankAccount) => {
    if (!primaryId) {
      setPrimaryId(account.id);
      return;
    }

    if (primaryId === account.id) {
      setPrimaryId(null);
      return;
    }

    if (secondaryIds.includes(account.id)) {
      setSecondaryIds((prev) => prev.filter((id) => id !== account.id));
      return;
    }

    if (secondaryIds.length < MAX_NOTIFICATION_ACCOUNTS - 1) {
      setSecondaryIds((prev) => [...prev, account.id]);
    }
  }, [primaryId, secondaryIds]);

  const handleSave = useCallback(async () => {
    await saveSettings({
      primaryAccountId: primaryId,
      secondaryAccount1Id: secondaryIds[0] ?? null,
      secondaryAccount2Id: secondaryIds[1] ?? null,
    });
    router.back();
  }, [primaryId, secondaryIds, saveSettings, router]);

  const getAccountStatus = (accountId: string): 'primary' | 'secondary' | 'none' => {
    if (accountId === primaryId) return 'primary';
    if (secondaryIds.includes(accountId)) return 'secondary';
    return 'none';
  };

  const renderAccount = useCallback(({ item }: { item: BankAccount }) => {
    const status = getAccountStatus(item.id);
    return (
      <Pressable
        style={[
          styles.accountCard,
          status === 'primary' && styles.accountCardPrimary,
          status === 'secondary' && styles.accountCardSecondary,
        ]}
        onPress={() => handleAccountPress(item)}
        accessibilityLabel={`${item.label} - ${status === 'primary' ? 'Principal' : status === 'secondary' ? 'Secondaire' : 'Non sélectionné'}`}
      >
        <View style={styles.accountInfo}>
          <Text style={styles.accountLabel}>{item.label}</Text>
          {item.maskedIban ? (
            <Text style={styles.accountIban}>{item.maskedIban}</Text>
          ) : null}
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {status === 'primary' ? '★ Principal' : status === 'secondary' ? 'Secondaire' : ''}
          </Text>
        </View>
      </Pressable>
    );
  }, [primaryId, secondaryIds, handleAccountPress]);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityLabel="Retour"
      >
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>Sélection des comptes</Text>
        <Text style={styles.subtitle}>
          Choisissez 1 compte principal et jusqu'à 2 secondaires pour les notifications.
        </Text>
      </View>

      {isLoading && accounts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderAccount}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun compte trouvé. Connectez d'abord votre banque.</Text>
          }
        />
      )}

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, !primaryId && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!primaryId}
          accessibilityLabel="Enregistrer la sélection"
        >
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  backButton: {
    paddingTop: spacing['5xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.text.link,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  accountCardPrimary: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.background.elevated,
  },
  accountCardSecondary: {
    borderColor: colors.accent.secondary,
  },
  accountInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  accountLabel: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  accountIban: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  badge: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  badgeText: {
    ...typography.small,
    color: colors.accent.primary,
  },
  separator: {
    height: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing['4xl'],
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
});
