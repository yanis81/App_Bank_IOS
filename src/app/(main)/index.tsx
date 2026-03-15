/**
 * Dashboard principal — Affiche les soldes et l'état général.
 * Intègre l'onboarding progressif, la bannière d'expiration GoCardless
 * et le mode confidentialité.
 */

import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
} from 'react-native';

import { useRouter, useFocusEffect } from 'expo-router';

import { useUser } from '@clerk/expo';

import { ConsentExpiryBanner } from '@/components/shared';
import { FreshnessIndicator } from '@/components/shared';
import { SkeletonBalanceCard, SkeletonActionList } from '@/components/ui/Skeleton';
import { useBankStore } from '@/stores/bank-store';
import { useWarmupStore } from '@/stores/warmup-store';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { isConnectionExpiringSoon } from '@/domain/entities';
import { formatCurrency } from '@/core/utils';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius, shadows } from '@/theme/shared';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUser();
  const {
    balanceSummary,
    accounts,
    connections,
    notificationSettings,
    isLoading,
    fetchBalanceSummary,
    fetchAccounts,
    fetchConnections,
    fetchSettings,
    fetchCardMappings,
    renewConsent,
  } = useBankStore();

  const { pendingSteps, completedSteps, totalSteps, isFullyConfigured } = useOnboardingProgress();

  const warmupStatus = useWarmupStore((s) => s.status);
  const isWarming = warmupStatus === 'idle' || warmupStatus === 'warming';

  // Chargement initial déclenché par la fin du warm-up serveur.
  useEffect(() => {
    if (warmupStatus !== 'ready' && warmupStatus !== 'timeout') return;
    fetchBalanceSummary();
    fetchAccounts();
    fetchConnections();
    fetchSettings();
    fetchCardMappings();
  }, [warmupStatus, fetchBalanceSummary, fetchAccounts, fetchConnections, fetchSettings, fetchCardMappings]);

  // Re-fetch à chaque fois que l'écran reprend le focus (retour depuis une sous-route).
  useFocusEffect(
    useCallback(() => {
      if (warmupStatus !== 'ready' && warmupStatus !== 'timeout') return;
      fetchBalanceSummary();
      fetchAccounts();
      fetchConnections();
      fetchSettings();
      fetchCardMappings();
    }, [warmupStatus, fetchBalanceSummary, fetchAccounts, fetchConnections, fetchSettings, fetchCardMappings])
  );

  const onRefresh = useCallback(() => {
    fetchBalanceSummary();
    fetchAccounts();
    fetchConnections();
    fetchSettings();
    fetchCardMappings();
  }, [fetchBalanceSummary, fetchAccounts, fetchConnections, fetchSettings, fetchCardMappings]);

  const handleRenewConsent = useCallback(async (connectionId: string) => {
    const conn = connections.find((c) => c.id === connectionId);
    if (!conn) return;
    const link = await renewConsent(connectionId, conn.aspspName, conn.aspspCountry);
    if (link) {
      await Linking.openURL(link);
    }
  }, [connections, renewConsent]);

  const isPrivacyMode = notificationSettings?.privacyMode ?? false;
  const hasAccounts = accounts.length > 0;
  const expiringConnections = connections.filter(isConnectionExpiringSoon);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={onRefresh}
          tintColor={colors.accent.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>
        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push('/(main)/settings')}
          accessibilityLabel="Ouvrir les réglages"
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* Bannière de réveil serveur */}
      {isWarming ? (
        <View style={styles.warmupBanner}>
          <ActivityIndicator size="small" color={colors.accent.primary} />
          <Text style={styles.warmupText}>Connexion au serveur en cours…</Text>
        </View>
      ) : null}

      {/* Bannières d'expiration GoCardless */}
      {expiringConnections.map((connection) => (
        <View key={connection.id} style={styles.bannerWrapper}>
          <ConsentExpiryBanner
            connection={connection}
            onRenew={handleRenewConsent}
          />
        </View>
      ))}

      {/* Barre de progression onboarding */}
      {!isFullyConfigured && hasAccounts ? (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>🚀 Configuration</Text>
            <Text style={styles.progressCount}>{completedSteps}/{totalSteps}</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(completedSteps / totalSteps) * 100}%` },
              ]}
            />
          </View>
        </View>
      ) : null}

      {/* Soldes (skeleton ou données) */}
      {isLoading && !balanceSummary ? (
        <View style={styles.skeletonWrapper}>
          <SkeletonBalanceCard />
          <SkeletonActionList count={2} />
        </View>
      ) : null}

      {/* Soldes */}
      {balanceSummary ? (
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>💳 Vos soldes</Text>
            <FreshnessIndicator lastUpdated={balanceSummary.lastUpdated} />
          </View>
          {(balanceSummary.accounts ?? []).map((account, index) => (
            <View key={`${account.label}-${index}`} style={styles.balanceRow}>
              <Text style={styles.accountLabel}>{account.label}</Text>
              <Text style={styles.accountAmount}>
                {isPrivacyMode ? '••••••' : formatCurrency(account.amount, account.currency)}
              </Text>
            </View>
          ))}
          {isPrivacyMode ? (
            <Text style={styles.privacyHint}>
              🔒 Mode confidentiel activé
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Étapes d'onboarding restantes (CTA contextuels) */}
      {pendingSteps.length > 0 ? (
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>
            {hasAccounts ? 'Prochaines étapes' : 'Commencer'}
          </Text>
          {pendingSteps.map((step) => (
            <Pressable
              key={step.id}
              style={styles.actionCard}
              onPress={() => router.push(step.route as import('expo-router').Href)}
              accessibilityLabel={step.title}
            >
              <Text style={styles.actionEmoji}>{step.emoji}</Text>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{step.title}</Text>
                <Text style={styles.actionDescription}>{step.description}</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Actions rapides quand tout est configuré */}
      {isFullyConfigured && hasAccounts ? (
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Gestion</Text>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/(main)/card-mapping')}
            accessibilityLabel="Configurer le mapping des cartes"
          >
            <Text style={styles.actionEmoji}>💳</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mapping cartes</Text>
              <Text style={styles.actionDescription}>
                Gérer l'association cartes Wallet ↔ comptes
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => router.push('/(main)/automation-guide')}
            accessibilityLabel="Configurer les automatisations"
          >
            <Text style={styles.actionEmoji}>⚡</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Automatisations</Text>
              <Text style={styles.actionDescription}>
                Gérer les notifications automatiques
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingTop: spacing['5xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  greeting: {
    ...typography.h2,
    color: colors.text.primary,
  },
  email: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  warmupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  warmupText: {
    ...typography.small,
    color: colors.text.secondary,
  },
  bannerWrapper: {
    marginBottom: spacing.md,
  },
  skeletonWrapper: {
    gap: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  progressCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  progressCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: radius.full,
  },
  balanceCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.card,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  balanceTimestamp: {
    ...typography.small,
    color: colors.text.tertiary,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  accountLabel: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  accountAmount: {
    ...typography.amountSmall,
    color: colors.text.primary,
  },
  privacyHint: {
    ...typography.small,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  quickActions: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.md,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  actionDescription: {
    ...typography.small,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  actionArrow: {
    ...typography.h2,
    color: colors.text.tertiary,
  },
});
