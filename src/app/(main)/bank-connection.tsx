/**
 * Écran de connexion bancaire.
 * Initie le flux Open Banking via GoCardless.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';

import { useRouter } from 'expo-router';

import { initiateConnection } from '@/data/api/endpoints';
import { logger } from '@/core/logger';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

export default function BankConnectionScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { redirectUrl } = await initiateConnection();
      await Linking.openURL(redirectUrl);
    } catch (err: unknown) {
      logger.error('Erreur connexion bancaire', { error: String(err) });
      setError('Impossible de lancer la connexion bancaire. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityLabel="Retour"
      >
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.emoji}>🏦</Text>
        <Text style={styles.title}>Connexion bancaire</Text>
        <Text style={styles.description}>
          Connectez votre banque en toute sécurité via Open Banking.
          Vos identifiants ne transitent jamais par notre application.
        </Text>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>Connexion sécurisée et chiffrée</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🏛️</Text>
            <Text style={styles.featureText}>2 400+ banques européennes</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📖</Text>
            <Text style={styles.featureText}>Accès lecture seule (soldes uniquement)</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.connectButton, isLoading && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={isLoading}
          accessibilityLabel="Connecter ma banque"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.connectButtonText}>Connecter ma banque</Text>
          )}
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
    paddingBottom: spacing.lg,
  },
  backText: {
    ...typography.body,
    color: colors.text.link,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    alignSelf: 'stretch',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.sm,
    padding: spacing.md,
    alignSelf: 'stretch',
  },
  errorText: {
    ...typography.caption,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  connectButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['4xl'],
    borderRadius: radius.md,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
});
