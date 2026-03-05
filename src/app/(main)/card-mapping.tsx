/**
 * Écran de mapping cartes Wallet ↔ comptes bancaires.
 * Chaque carte Wallet est associée à un compte pour les notifications post-paiement.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { useRouter } from 'expo-router';

import { useBankStore } from '@/stores/bank-store';
import type { BankAccount } from '@/domain/entities';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

export default function CardMappingScreen() {
  const router = useRouter();
  const {
    accounts,
    cardMappings,
    isLoading,
    fetchAccounts,
    fetchCardMappings,
    saveCardMapping,
    removeCardMapping,
  } = useBankStore();

  const [newCardLabel, setNewCardLabel] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchCardMappings();
  }, [fetchAccounts, fetchCardMappings]);

  const handleAddMapping = useCallback(async () => {
    if (!newCardLabel.trim() || !selectedAccountId) return;

    await saveCardMapping(newCardLabel.trim(), selectedAccountId);
    setNewCardLabel('');
    setSelectedAccountId(null);
    setShowAccountPicker(false);
  }, [newCardLabel, selectedAccountId, saveCardMapping]);

  const handleDeleteMapping = useCallback(async (mappingId: string) => {
    await removeCardMapping(mappingId);
  }, [removeCardMapping]);

  const getAccountLabel = (accountId: string): string => {
    return accounts.find((a) => a.id === accountId)?.label ?? 'Compte inconnu';
  };

  const renderAccountOption = useCallback(({ item }: { item: BankAccount }) => (
    <Pressable
      style={[
        styles.accountOption,
        selectedAccountId === item.id && styles.accountOptionSelected,
      ]}
      onPress={() => {
        setSelectedAccountId(item.id);
        setShowAccountPicker(false);
      }}
      accessibilityLabel={`Sélectionner ${item.label}`}
    >
      <Text style={styles.accountOptionText}>{item.label}</Text>
      {selectedAccountId === item.id ? (
        <Text style={styles.checkmark}>✓</Text>
      ) : null}
    </Pressable>
  ), [selectedAccountId]);

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
        <Text style={styles.title}>Mapping cartes</Text>
        <Text style={styles.subtitle}>
          Associez vos cartes Apple Wallet à vos comptes bancaires pour les notifications post-paiement.
        </Text>
      </View>

      {/* Formulaire d'ajout */}
      <View style={styles.addForm}>
        <TextInput
          style={styles.input}
          value={newCardLabel}
          onChangeText={setNewCardLabel}
          placeholder='Nom de la carte (ex: "Boursobank Visa")'
          placeholderTextColor={colors.text.tertiary}
          accessibilityLabel="Nom de la carte Wallet"
        />

        <Pressable
          style={styles.pickerButton}
          onPress={() => setShowAccountPicker(!showAccountPicker)}
          accessibilityLabel="Choisir un compte"
        >
          <Text style={styles.pickerButtonText}>
            {selectedAccountId
              ? getAccountLabel(selectedAccountId)
              : 'Choisir un compte →'}
          </Text>
        </Pressable>

        {showAccountPicker ? (
          <FlatList
            data={accounts}
            renderItem={renderAccountOption}
            keyExtractor={(item) => item.id}
            style={styles.accountList}
          />
        ) : null}

        <Pressable
          style={[
            styles.addButton,
            (!newCardLabel.trim() || !selectedAccountId) && styles.addButtonDisabled,
          ]}
          onPress={handleAddMapping}
          disabled={!newCardLabel.trim() || !selectedAccountId || isLoading}
          accessibilityLabel="Ajouter le mapping"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.text.primary} />
          ) : (
            <Text style={styles.addButtonText}>Ajouter</Text>
          )}
        </Pressable>
      </View>

      {/* Liste des mappings */}
      <View style={styles.mappingsSection}>
        <Text style={styles.sectionTitle}>Mappings configurés</Text>
        {cardMappings.length === 0 ? (
          <Text style={styles.emptyText}>Aucun mapping configuré.</Text>
        ) : (
          cardMappings.map((mapping) => (
            <View key={mapping.id} style={styles.mappingCard}>
              <View style={styles.mappingInfo}>
                <Text style={styles.mappingCardLabel}>{mapping.walletCardLabel}</Text>
                <Text style={styles.mappingAccountLabel}>
                  → {getAccountLabel(mapping.accountId)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleDeleteMapping(mapping.id)}
                style={styles.deleteButton}
                accessibilityLabel={`Supprimer le mapping ${mapping.walletCardLabel}`}
              >
                <Text style={styles.deleteText}>✕</Text>
              </Pressable>
            </View>
          ))
        )}
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
  addForm: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pickerButton: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  pickerButtonText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  accountList: {
    maxHeight: 200,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  accountOptionSelected: {
    backgroundColor: colors.background.elevated,
  },
  accountOptionText: {
    ...typography.body,
    color: colors.text.primary,
  },
  checkmark: {
    ...typography.bodyBold,
    color: colors.accent.primary,
  },
  addButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  mappingsSection: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  emptyText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  mappingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  mappingInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  mappingCardLabel: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  mappingAccountLabel: {
    ...typography.caption,
    color: colors.accent.secondary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: colors.semantic.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
