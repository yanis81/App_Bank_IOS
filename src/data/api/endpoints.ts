/**
 * Endpoints API organisés par domaine.
 *
 * @module data/api/endpoints
 */

import { api } from './api-client';
import type { BalanceSummary, BankAccount, BankConnection, NotificationSettings, User, WalletCardBalance, WalletCardMapping } from '@/domain/entities';

// ─── Auth ────────────────────────────────────────────────────────

/**
 * Inscrit un nouvel utilisateur.
 */
export function registerUser(email: string, password: string) {
  return api.post<{ user: User; sessionToken: string }>(
    '/auth/register',
    { email, password },
    true,
  );
}

/**
 * Connecte un utilisateur existant.
 */
export function loginUser(email: string, password: string) {
  return api.post<{ user: User; sessionToken: string }>(
    '/auth/login',
    { email, password },
    true,
  );
}

/**
 * Déconnecte l'utilisateur courant.
 */
export function logoutUser() {
  return api.post<void>('/auth/logout');
}

/**
 * Récupère les informations de l'utilisateur courant.
 */
export function getMe() {
  return api.get<User>('/auth/me');
}

// ─── Bank ────────────────────────────────────────────────────────

/**
 * Initie une connexion Open Banking.
 */
export function initiateConnection() {
  return api.post<{ redirectUrl: string }>('/bank/connect');
}

/**
 * Ré-initie le consentement pour une connexion existante (re-consentement PSD2).
 *
 * @param connectionId - ID de la connexion à renouveler.
 */
export function renewBankConsent(connectionId: string) {
  return api.post<{ redirectUrl: string }>(`/bank/connections/${encodeURIComponent(connectionId)}/renew`);
}

/**
 * Liste les connexions bancaires de l'utilisateur avec leur statut.
 */
export function getBankConnections() {
  return api.get<BankConnection[]>('/bank/connections');
}

/**
 * Liste les comptes bancaires de l'utilisateur.
 */
export function getBankAccounts() {
  return api.get<BankAccount[]>('/bank/accounts');
}

/**
 * Supprime une connexion bancaire.
 */
export function deleteBankConnection(connectionId: string) {
  return api.delete<void>(`/bank/connections/${encodeURIComponent(connectionId)}`);
}

// ─── Balances ────────────────────────────────────────────────────

/**
 * Récupère le résumé des soldes (notification pré-paiement, 3 comptes max).
 */
export function getBalanceSummary() {
  return api.get<BalanceSummary>('/balances/summary');
}

/**
 * Récupère le solde par label de carte Wallet (notification post-paiement).
 */
export function getBalanceByWalletCard(cardLabel: string) {
  return api.get<WalletCardBalance>(`/balances/by-wallet-card?cardLabel=${encodeURIComponent(cardLabel)}`);
}

// ─── Wallet Card Mappings ────────────────────────────────────────

/**
 * Liste les mappings carte Wallet ↔ compte bancaire.
 */
export function getCardMappings() {
  return api.get<WalletCardMapping[]>('/wallet-cards/mappings');
}

/**
 * Crée ou met à jour un mapping carte.
 */
export function upsertCardMapping(walletCardLabel: string, accountId: string) {
  return api.post<WalletCardMapping>('/wallet-cards/mappings', { walletCardLabel, accountId });
}

/**
 * Supprime un mapping carte.
 */
export function deleteCardMapping(mappingId: string) {
  return api.delete<void>(`/wallet-cards/mappings/${encodeURIComponent(mappingId)}`);
}

// ─── Settings ────────────────────────────────────────────────────

/**
 * Récupère les réglages de notification.
 */
export function getNotificationSettings() {
  return api.get<NotificationSettings>('/settings');
}

/**
 * Met à jour les réglages de notification.
 */
export function updateNotificationSettings(settings: Partial<NotificationSettings>) {
  return api.put<NotificationSettings>('/settings', settings as Record<string, unknown>);
}
