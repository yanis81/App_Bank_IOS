/**
 * Écran de callback après authentification bancaire Open Banking.
 * Reçoit le deep link Enable Banking (code + state) et finalise la connexion.
 *
 * Route : /(main)/bank-callback
 * Deep link : wallet-balance-assistant://bank-callback?code=xxx&state=yyy
 *
 * @module app/(main)/bank-callback
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';

import { completeBankConnection } from '@/data/api/endpoints';
import { useBankStore } from '@/stores/bank-store';
import { logger } from '@/core/logger';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function BankCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const { fetchAccounts, fetchConnections } = useBankStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('La connexion a échoué.');

  useEffect(() => {
    async function handleCallback() {
      try {
        if (params.error) {
          setErrorMessage('Authentification annulée ou refusée par la banque.');
          setStatus('error');
          return;
        }

        if (!params.code || !params.state) {
          setErrorMessage('Paramètres de callback manquants.');
          setStatus('error');
          return;
        }

        await completeBankConnection(params.code, params.state);
        await Promise.all([fetchAccounts(), fetchConnections()]);
        setStatus('success');

        setTimeout(() => {
          router.replace('/(main)/account-selection');
        }, 1500);
      } catch (error: unknown) {
        logger.error('Erreur finalisation connexion bancaire', { error: String(error) });
        setErrorMessage('Impossible de finaliser la connexion. Réessayez.');
        setStatus('error');
        setTimeout(() => {
          router.replace('/(main)');
        }, 2500);
      }
    }

    handleCallback();
  }, [params.code, params.state, params.error, fetchAccounts, fetchConnections, router]);

  return (
    <View style={styles.container}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.text}>Finalisation de la connexion...</Text>
        </>
      ) : status === 'success' ? (
        <>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>Banque connectée !</Text>
          <Text style={styles.text}>Redirection vers la sélection de comptes...</Text>
        </>
      ) : (
        <>
          <Text style={styles.emoji}>❌</Text>
          <Text style={styles.title}>Erreur de connexion</Text>
          <Text style={styles.text}>{errorMessage}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => router.replace('/(main)/bank-connection')}
            accessibilityLabel="Réessayer la connexion"
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.accent.primary,
  },
  retryText: {
    ...typography.button,
    color: colors.text.primary,
  },
});
