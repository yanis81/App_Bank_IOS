/**
 * Store des données bancaires (comptes, soldes, mappings).
 *
 * @module stores/bank-store
 */

import { create } from 'zustand';

import { logger } from '@/core/logger';
import {
  getBankAccounts,
  getBalanceSummary,
  getCardMappings,
  upsertCardMapping,
  deleteCardMapping,
  getNotificationSettings,
  updateNotificationSettings,
  getBankConnections,
  renewBankConsent,
} from '@/data/api/endpoints';
import { cacheBalanceSummary, getCachedBalanceSummary } from '@/data/storage/shared-cache';
import type {
  BankAccount,
  BankConnection,
  BalanceSummary,
  WalletCardMapping,
  NotificationSettings,
} from '@/domain/entities';

interface BankState {
  /** Liste des comptes bancaires. */
  accounts: BankAccount[];
  /** Connexions bancaires avec statut d'expiration. */
  connections: BankConnection[];
  /** Résumé des soldes (pré-notification). */
  balanceSummary: BalanceSummary | null;
  /** Mappings carte Wallet ↔ compte. */
  cardMappings: WalletCardMapping[];
  /** Réglages de notification. */
  notificationSettings: NotificationSettings | null;
  /** Indicateur de chargement. */
  isLoading: boolean;
  /** Message d'erreur. */
  error: string | null;
}

interface BankActions {
  /** Charge les comptes bancaires. */
  fetchAccounts: () => Promise<void>;
  /** Charge les connexions bancaires. */
  fetchConnections: () => Promise<void>;
  /** Renouvelle le consentement d'une connexion expirée/expirante. */
  renewConsent: (connectionId: string, aspspName: string, aspspCountry: string) => Promise<string | null>;
  /** Charge le résumé des soldes. */
  fetchBalanceSummary: () => Promise<void>;
  /** Charge les mappings cartes. */
  fetchCardMappings: () => Promise<void>;
  /** Crée ou met à jour un mapping. */
  saveCardMapping: (walletCardLabel: string, accountId: string) => Promise<void>;
  /** Supprime un mapping. */
  removeCardMapping: (mappingId: string) => Promise<void>;
  /** Charge les réglages. */
  fetchSettings: () => Promise<void>;
  /** Met à jour les réglages. */
  saveSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  /** Efface l'erreur. */
  clearError: () => void;
}

export const useBankStore = create<BankState & BankActions>((set) => ({
  accounts: [],
  connections: [],
  balanceSummary: null,
  cardMappings: [],
  notificationSettings: null,
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    try {
      set({ isLoading: true, error: null });
      const accounts = await getBankAccounts();
      set({ accounts, isLoading: false });
    } catch (error: unknown) {
      logger.error('Erreur chargement comptes', { error: String(error) });
      set({ error: 'Impossible de charger les comptes bancaires.', isLoading: false });
    }
  },

  fetchConnections: async () => {
    try {
      set({ isLoading: true, error: null });
      const connections = await getBankConnections();
      set({ connections, isLoading: false });
    } catch (error: unknown) {
      logger.error('Erreur chargement connexions', { error: String(error) });
      set({ error: 'Impossible de charger les connexions bancaires.', isLoading: false });
    }
  },

  renewConsent: async (connectionId: string, aspspName: string, aspspCountry: string) => {
    try {
      set({ isLoading: true, error: null });
      const { link } = await renewBankConsent(connectionId, aspspName, aspspCountry);
      set({ isLoading: false });
      return link;
    } catch (error: unknown) {
      logger.error('Erreur renouvellement consentement', { error: String(error) });
      set({ error: 'Impossible de renouveler le consentement.', isLoading: false });
      return null;
    }
  },

  fetchBalanceSummary: async () => {
    try {
      set({ isLoading: true, error: null });
      const balanceSummary = await getBalanceSummary();
      await cacheBalanceSummary(balanceSummary);
      set({ balanceSummary, isLoading: false });
    } catch (error: unknown) {
      logger.error('Erreur chargement soldes', { error: String(error) });
      const cached = await getCachedBalanceSummary();
      if (cached) {
        logger.info('Utilisation du cache local pour les soldes');
        set({ balanceSummary: cached, error: null, isLoading: false });
      } else {
        set({ error: 'Impossible de charger les soldes.', isLoading: false });
      }
    }
  },

  fetchCardMappings: async () => {
    try {
      set({ isLoading: true, error: null });
      const cardMappings = await getCardMappings();
      set({ cardMappings, isLoading: false });
    } catch (error: unknown) {
      logger.error('Erreur chargement mappings', { error: String(error) });
      set({ error: 'Impossible de charger les mappings.', isLoading: false });
    }
  },

  saveCardMapping: async (walletCardLabel: string, accountId: string) => {
    try {
      set({ isLoading: true, error: null });
      const newMapping = await upsertCardMapping(walletCardLabel, accountId);
      set((state) => ({
        cardMappings: [
          ...state.cardMappings.filter((m) => m.walletCardLabel !== walletCardLabel),
          newMapping,
        ],
        isLoading: false,
      }));
    } catch (error: unknown) {
      logger.error('Erreur sauvegarde mapping', { error: String(error) });
      set({ error: 'Impossible de sauvegarder le mapping.', isLoading: false });
    }
  },

  removeCardMapping: async (mappingId: string) => {
    try {
      set({ isLoading: true, error: null });
      await deleteCardMapping(mappingId);
      set((state) => ({
        cardMappings: state.cardMappings.filter((m) => m.id !== mappingId),
        isLoading: false,
      }));
    } catch (error: unknown) {
      logger.error('Erreur suppression mapping', { error: String(error) });
      set({ error: 'Impossible de supprimer le mapping.', isLoading: false });
    }
  },

  fetchSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      const notificationSettings = await getNotificationSettings();
      set({ notificationSettings, isLoading: false });
    } catch (error: unknown) {
      logger.error('Erreur chargement réglages', { error: String(error) });
      set({ error: 'Impossible de charger les réglages.', isLoading: false });
    }
  },

  saveSettings: async (settings: Partial<NotificationSettings>) => {
    try {
      set({ isLoading: true, error: null });
      const notificationSettings = await updateNotificationSettings(settings);
      set({ notificationSettings, isLoading: false });
    } catch (error: unknown) {
      logger.error('Erreur sauvegarde réglages', { error: String(error) });
      set({ error: 'Impossible de sauvegarder les réglages.', isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
