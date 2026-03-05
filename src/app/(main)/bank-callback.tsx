/**
 * Écran de callback après authentification bancaire Open Banking.
 * Reçoit le deep link de retour GoCardless et redirige vers la sélection de comptes.
 *
 * Route : /(main)/bank-callback
 * Deep link : wallet-balance-assistant://bank-callback?status=success
 *
 * @module app/(main)/bank-callback
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';

import { useBankStore } from '@/stores/bank-store';
import { logger } from '@/core/logger';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function BankCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const { fetchAccounts, fetchConnections } = useBankStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function handleCallback() {
      try {
        if (params.status === 'error') {
          setStatus('error');
          return;
        }

        await Promise.all([fetchAccounts(), fetchConnections()]);
        setStatus('success');

        setTimeout(() => {
          router.replace('/(main)/account-selection');
        }, 1500);
      } catch (error: unknown) {
        logger.error('Erreur callback bancaire', { error: String(error) });
        setStatus('error');
        setTimeout(() => {
          router.replace('/(main)');
        }, 2000);
      }
    }

    handleCallback();
  }, [params.status, fetchAccounts, fetchConnections, router]);

  return (
    <View style={styles.container}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.text}>Connexion en cours...</Text>
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
          <Text style={styles.text}>Retour au dashboard...</Text>
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
});
