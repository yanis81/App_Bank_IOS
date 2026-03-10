/**
 * Écran de connexion bancaire.
 * Permet à l'utilisateur de choisir sa banque et d'initier le flux Open Banking via Enable Banking.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  FlatList,
  TextInput,
} from 'react-native';

import { useRouter } from 'expo-router';

import { getInstitutions, initiateConnection } from '@/data/api/endpoints';
import { logger } from '@/core/logger';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';
import type { Institution } from '@/domain/entities';

export default function BankConnectionScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'connecting'>('select');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filtered, setFiltered] = useState<Institution[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Institution | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInstitutions('FR')
      .then((list) => {
        setInstitutions(list);
        setFiltered(list);
      })
      .catch((err: unknown) => {
        logger.error('Erreur chargement banques', { error: String(err) });
        setError('Impossible de charger la liste des banques.');
      })
      .finally(() => setIsLoadingList(false));
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    const q = text.toLowerCase();
    setFiltered(
      institutions.filter(
        (i) => i.name.toLowerCase().includes(q) || i.bic.toLowerCase().includes(q),
      ),
    );
  }, [institutions]);

  const handleConnect = useCallback(async () => {
    if (!selected) return;
    try {
      setIsConnecting(true);
      setError(null);
      const { link } = await initiateConnection(selected.name, selected.country);
      await Linking.openURL(link);
    } catch (err: unknown) {
      logger.error('Erreur connexion bancaire', { error: String(err) });
      setError('Impossible de lancer la connexion bancaire. Réessayez.');
    } finally {
      setIsConnecting(false);
    }
  }, [selected]);

  if (step === 'connecting') return null;

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Retour">
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.emoji}>🏦</Text>
        <Text style={styles.title}>Choisissez votre banque</Text>
        <Text style={styles.description}>
          Votre banque se charge de l'authentification.{'\n'}
          Nous n'accédons qu'à vos soldes.
        </Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher une banque..."
        placeholderTextColor={colors.text.tertiary}
        value={search}
        onChangeText={handleSearch}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Rechercher une banque"
      />

      {isLoadingList ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.country}-${item.name}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucune banque trouvée pour « {search} »</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.bankRow, selected?.name === item.name && styles.bankRowSelected]}
              onPress={() => setSelected(item)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected?.name === item.name }}
            >
              <Text style={styles.bankName}>{item.name}</Text>
              <Text style={styles.bankBic}>{item.bic}</Text>
              {selected?.name === item.name && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          )}
        />
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          style={[styles.connectButton, (!selected || isConnecting) && styles.connectButtonDisabled]}
          onPress={handleConnect}
          disabled={!selected || isConnecting}
          accessibilityLabel="Connecter ma banque"
        >
          {isConnecting ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.connectButtonText}>
              {selected ? `Connecter ${selected.name}` : 'Sélectionnez une banque'}
            </Text>
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
    paddingBottom: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.text.link,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 48,
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
    lineHeight: 22,
  },
  searchInput: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  bankRowSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.07)',
  },
  bankName: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  bankBic: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  checkmark: {
    fontSize: 16,
    color: colors.accent.primary,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing['2xl'],
  },
  errorContainer: {
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  connectButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    opacity: 0.5,
  },
  connectButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
});

