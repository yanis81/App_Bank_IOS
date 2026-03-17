/**
 * Store d'authentification.
 * Gère l'état complémentaire à Clerk (session token backend, cache local).
 * L'authentification principale est gérée par Clerk SDK.
 *
 * @module stores/auth-store
 */

import { create } from 'zustand';

import { SECURE_STORE_SESSION_TOKEN_KEY } from '@/core/config/constants';
import { logger } from '@/core/logger';
import { secureStorage } from '@/data/storage/secure-storage';
import { walletBridgeService } from '@/data/storage/wallet-bridge';

interface AuthState {
  /** Token de session backend (UUID long-lived pour App Intents). */
  backendSessionToken: string | null;
  /** Indique si le token backend a été chargé depuis le Keychain. */
  isBackendTokenLoaded: boolean;
}

interface AuthActions {
  /** Charge le token backend depuis le Keychain au démarrage. */
  loadBackendToken: () => Promise<void>;
  /** Stocke un nouveau token backend (reçu après échange avec le backend). */
  setBackendToken: (token: string) => Promise<void>;
  /** Supprime le token backend (déconnexion). */
  clearBackendToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  backendSessionToken: null,
  isBackendTokenLoaded: false,

  loadBackendToken: async () => {
    try {
      const token = await secureStorage.get(SECURE_STORE_SESSION_TOKEN_KEY);
      if (token) {
        walletBridgeService.setSharedToken(token);
      }
      set({ backendSessionToken: token, isBackendTokenLoaded: true });
    } catch {
      logger.warn('Erreur chargement token backend');
      set({ backendSessionToken: null, isBackendTokenLoaded: true });
    }
  },

  setBackendToken: async (token: string) => {
    await secureStorage.set(SECURE_STORE_SESSION_TOKEN_KEY, token);
    walletBridgeService.setSharedToken(token);
    set({ backendSessionToken: token });
  },

  clearBackendToken: async () => {
    await secureStorage.delete(SECURE_STORE_SESSION_TOKEN_KEY);
    walletBridgeService.deleteSharedToken();
    set({ backendSessionToken: null });
  },
}));
