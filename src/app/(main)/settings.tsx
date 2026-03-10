/**
 * Écran des réglages utilisateur.
 * Permet de gérer les comptes, mappings, refresh et confidentialité.
 */

import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';

import { useRouter } from 'expo-router';

import { useClerk, useUser } from '@clerk/expo';

import { useBankStore } from '@/stores/bank-store';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { hapticSelection, hapticMedium } from '@/core/utils/haptics';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { notificationSettings, fetchSettings, saveSettings } = useBankStore();
  const { isAvailable: isBiometricAvailable, biometricType, isEnabled: isBiometricEnabled, setEnabled: setBiometricEnabled } = useBiometricAuth();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleTogglePrivacy = useCallback((value: boolean) => {
    hapticSelection();
    saveSettings({ privacyMode: value });
  }, [saveSettings]);

  const handleRefreshChange = useCallback((value: 2 | 3) => {
    hapticSelection();
    saveSettings({ refreshPerDay: value });
  }, [saveSettings]);

  const handleLogout = useCallback(async () => {
    hapticMedium();
    await signOut();
  }, [signOut]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityLabel="Retour"
      >
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <Text style={styles.title}>Réglages</Text>

      {/* Compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{user?.primaryEmailAddress?.emailAddress}</Text>
        </View>
      </View>

      {/* Comptes bancaires */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comptes bancaires</Text>

        <Pressable
          style={styles.actionRow}
          onPress={() => router.push('/(main)/account-selection')}
          accessibilityLabel="Modifier les comptes de notification"
        >
          <Text style={styles.actionRowText}>Comptes de notification</Text>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.actionRow}
          onPress={() => router.push('/(main)/card-mapping')}
          accessibilityLabel="Configurer le mapping des cartes"
        >
          <Text style={styles.actionRowText}>Mapping cartes Wallet</Text>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>

        <Pressable
          style={styles.actionRow}
          onPress={() => router.push('/(main)/bank-connection')}
          accessibilityLabel="Ajouter une connexion bancaire"
        >
          <Text style={styles.actionRowText}>Connexion bancaire</Text>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Mode confidentialité</Text>
          <Switch
            value={notificationSettings?.privacyMode ?? false}
            onValueChange={handleTogglePrivacy}
            trackColor={{ false: colors.border.subtle, true: colors.accent.primary }}
            thumbColor={colors.text.primary}
            accessibilityLabel="Activer le mode confidentialité"
          />
        </View>

        <View style={styles.refreshRow}>
          <Text style={styles.rowLabel}>Fréquence de rafraîchissement</Text>
          <View style={styles.refreshOptions}>
            <Pressable
              style={[
                styles.refreshOption,
                notificationSettings?.refreshPerDay === 2 && styles.refreshOptionActive,
              ]}
              onPress={() => handleRefreshChange(2)}
              accessibilityLabel="Rafraîchir 2 fois par jour"
            >
              <Text
                style={[
                  styles.refreshOptionText,
                  notificationSettings?.refreshPerDay === 2 && styles.refreshOptionTextActive,
                ]}
              >
                2x/jour
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.refreshOption,
                notificationSettings?.refreshPerDay === 3 && styles.refreshOptionActive,
              ]}
              onPress={() => handleRefreshChange(3)}
              accessibilityLabel="Rafraîchir 3 fois par jour"
            >
              <Text
                style={[
                  styles.refreshOptionText,
                  notificationSettings?.refreshPerDay === 3 && styles.refreshOptionTextActive,
                ]}
              >
                3x/jour
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Sécurité */}
      {isBiometricAvailable ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{biometricType ?? 'Biométrie'}</Text>
            <Switch
              value={isBiometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: colors.border.subtle, true: colors.accent.primary }}
              thumbColor={colors.text.primary}
              accessibilityLabel={`Activer ${biometricType ?? 'la biométrie'}`}
            />
          </View>
        </View>
      ) : null}

      {/* Automatisations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Automatisations</Text>
        <Pressable
          style={styles.actionRow}
          onPress={() => router.push('/(main)/automation-guide')}
          accessibilityLabel="Réinstaller les automatisations"
        >
          <Text style={styles.actionRowText}>Guide d'installation</Text>
          <Text style={styles.actionArrow}>›</Text>
        </Pressable>
      </View>

      {/* Déconnexion */}
      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
        accessibilityLabel="Se déconnecter"
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingBottom: spacing['5xl'],
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
  title: {
    ...typography.h2,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  section: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionTitle: {
    ...typography.small,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  rowLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  rowValue: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  actionRowText: {
    ...typography.body,
    color: colors.text.primary,
  },
  actionArrow: {
    ...typography.h3,
    color: colors.text.tertiary,
  },
  refreshRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    gap: spacing.md,
  },
  refreshOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  refreshOption: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  refreshOptionActive: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  refreshOptionText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  refreshOptionTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  logoutButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.semantic.error,
  },
  logoutText: {
    ...typography.button,
    color: colors.semantic.error,
  },
  version: {
    ...typography.small,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
