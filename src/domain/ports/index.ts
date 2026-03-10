/**
 * Ports (interfaces) du domaine.
 * Contrats que les implémentations (data layer) doivent respecter.
 *
 * @module domain/ports
 */

import type {
  BalanceSummary,
  BankAccount,
  BankConnection,
  NotificationSettings,
  User,
  WalletCardBalance,
  WalletCardMapping,
} from '../entities';

/** Contrat du repository d'authentification (Clerk gère l'auth, seul getMe reste). */
export interface AuthRepository {
  /** Récupère les infos de l'utilisateur courant. */
  getMe(): Promise<User>;
}

/** Contrat du repository bancaire. */
export interface BankRepository {
  /** Initie une connexion Open Banking et retourne le lien d'auth + state. */
  initiateConnection(aspspName: string, aspspCountry: string): Promise<{ link: string; state: string }>;
  /** Liste les comptes bancaires de l'utilisateur. */
  getAccounts(): Promise<BankAccount[]>;
  /** Supprime une connexion bancaire. */
  deleteConnection(connectionId: string): Promise<void>;
  /** Liste les connexions bancaires. */
  getConnections(): Promise<BankConnection[]>;
}

/** Contrat du repository de soldes. */
export interface BalanceRepository {
  /** Récupère le résumé des soldes (3 comptes max, notification pré). */
  getSummary(): Promise<BalanceSummary>;
  /** Récupère le solde par label de carte Wallet (notification post). */
  getByWalletCard(cardLabel: string): Promise<WalletCardBalance>;
}

/** Contrat du repository de mapping cartes. */
export interface CardMappingRepository {
  /** Liste les mappings existants. */
  getMappings(): Promise<WalletCardMapping[]>;
  /** Crée ou met à jour un mapping. */
  upsertMapping(walletCardLabel: string, accountId: string): Promise<WalletCardMapping>;
  /** Supprime un mapping. */
  deleteMapping(mappingId: string): Promise<void>;
}

/** Contrat du repository des réglages. */
export interface SettingsRepository {
  /** Récupère les réglages de notification. */
  getSettings(): Promise<NotificationSettings>;
  /** Met à jour les réglages de notification. */
  updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings>;
}

/** Contrat du service de stockage sécurisé. */
export interface SecureStorageService {
  /** Stocke une valeur chiffrée dans le Keychain. */
  set(key: string, value: string): Promise<void>;
  /** Récupère une valeur depuis le Keychain. */
  get(key: string): Promise<string | null>;
  /** Supprime une valeur du Keychain. */
  delete(key: string): Promise<void>;
}
