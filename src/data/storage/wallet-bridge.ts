import { requireNativeModule } from 'expo-modules-core';

import type { BalanceSummary } from '../../domain/entities';

/** Types pour le module natif WalletBridge. */
interface WalletBridgeNativeModule {
  setCachedBalances(jsonString: string): boolean;
  getCachedBalances(): string | null;
  getCacheTimestamp(): number;
  setSharedToken(token: string): boolean;
  getSharedToken(): string | null;
  deleteSharedToken(): boolean;
  isAvailable(): boolean;
}

const WalletBridge = requireNativeModule<WalletBridgeNativeModule>('WalletBridge');

/**
 * Service pour le cache partagé App Group (accessible par les App Intents Swift).
 * Permet aux notifications de s'afficher en < 1 seconde via cache local.
 */
export const walletBridgeService = {
  /**
   * Sauvegarde les soldes dans le cache partagé (App Group UserDefaults).
   * Les App Intents liront ce cache pour afficher les notifications.
   */
  setCachedBalances(summary: BalanceSummary, privacyMode: boolean): boolean {
    const data = JSON.stringify({
      accounts: summary.accounts.map((a: { readonly label: string; readonly amount: number; readonly currency: string }) => ({
        label: a.label,
        amount: a.amount,
        currency: a.currency,
      })),
      privacyMode,
    });
    return WalletBridge.setCachedBalances(data);
  },

  /**
   * Récupère les soldes depuis le cache partagé.
   */
  getCachedBalances(): BalanceSummary | null {
    const json = WalletBridge.getCachedBalances();
    if (!json) return null;
    try {
      return JSON.parse(json) as BalanceSummary;
    } catch {
      return null;
    }
  },

  /**
   * Récupère le timestamp du dernier cache (epoch en secondes).
   */
  getCacheTimestamp(): number {
    return WalletBridge.getCacheTimestamp();
  },

  /**
   * Sauvegarde le token Clerk dans le Keychain partagé (App Group).
   * Permet aux App Intents d'accéder à l'API backend.
   */
  setSharedToken(token: string): boolean {
    return WalletBridge.setSharedToken(token);
  },

  /**
   * Supprime le token du Keychain partagé (déconnexion).
   */
  deleteSharedToken(): boolean {
    return WalletBridge.deleteSharedToken();
  },

  /**
   * Vérifie si le module natif est disponible.
   */
  isAvailable(): boolean {
    try {
      return WalletBridge.isAvailable();
    } catch {
      return false;
    }
  },
};
