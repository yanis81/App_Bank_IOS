/**
 * Endpoints API organisés par domaine.
 *
 * @module data/api/endpoints
 */

import { api } from './api-client';
import type { BalanceSummary, BankAccount, BankConnection, Institution, NotificationSettings, User, WalletCardBalance, WalletCardMapping } from '@/domain/entities';

// ─── Auth ────────────────────────────────────────────────────────

/**
 * Récupère les informations de l'utilisateur courant.
 */
export function getMe() {
  return api.get<User>('/auth/me');
}

// ─── Bank ────────────────────────────────────────────────────────

/**
 * Liste les banques disponibles (ASPSP) pour un pays donné.
 *
 * @param country - Code ISO 3166 du pays (ex. "FR").
 */
export function getInstitutions(country: string = 'FR') {
  return api.get<Institution[]>(`/bank/institutions?country=${encodeURIComponent(country)}`);
}

/**
 * Initie une connexion Open Banking via Enable Banking.
 * Retourne l'URL de redirection vers laquelle ouvrir le navigateur.
 *
 * @param aspspName - Nom exact de la banque (ex. "Boursorama").
 * @param aspspCountry - Code pays ISO 3166 de la banque (ex. "FR").
 */
export function initiateConnection(aspspName: string, aspspCountry: string) {
  return api.post<{ link: string; state: string }>('/bank/connect', { aspspName, aspspCountry });
}

/**
 * Finalise la connexion bancaire après retour du deep link Enable Banking.
 * Échange le code OAuth2 contre une session et importe les comptes.
 *
 * @param code - Code OAuth2 reçu dans le deep link.
 * @param state - State UUID reçu dans le deep link (pour retrouver la connexion en DB).
 */
export function completeBankConnection(code: string, state: string) {
  return api.get<{ status: string; accountsImported: number }>(
    `/bank/connect/complete?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
  );
}

/**
 * Ré-initie le consentement PSD2 pour une connexion existante.
 *
 * @param connectionId - ID de la connexion à renouveler.
 * @param aspspName - Nom de la banque.
 * @param aspspCountry - Code pays de la banque.
 */
export function renewBankConsent(connectionId: string, aspspName: string, aspspCountry: string) {
  return api.post<{ link: string; state: string }>(
    `/bank/connections/${encodeURIComponent(connectionId)}/renew`,
    { aspspName, aspspCountry }
  );
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
