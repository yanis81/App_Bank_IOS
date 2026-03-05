/**
 * Store d'authentification.
 * Gère l'état de connexion, le token de session et les infos utilisateur.
 *
 * @module stores/auth-store
 */

import { create } from 'zustand';

import { SECURE_STORE_SESSION_TOKEN_KEY } from '@/core/config/constants';
import { logger } from '@/core/logger';
import { loginUser, registerUser, logoutUser, getMe } from '@/data/api/endpoints';
import { secureStorage } from '@/data/storage/secure-storage';
import type { User } from '@/domain/entities';

interface AuthState {
  /** Utilisateur courant (null si non connecté). */
  user: User | null;
  /** Indique si un chargement est en cours. */
  isLoading: boolean;
  /** Indique si la session a été vérifiée au démarrage. */
  isInitialized: boolean;
  /** Message d'erreur courant. */
  error: string | null;
}

interface AuthActions {
  /** Initialise la session au démarrage (vérifie le token existant). */
  initialize: () => Promise<void>;
  /** Inscrit un nouvel utilisateur. */
  register: (email: string, password: string) => Promise<void>;
  /** Connecte un utilisateur existant. */
  login: (email: string, password: string) => Promise<void>;
  /** Déconnecte l'utilisateur. */
  logout: () => Promise<void>;
  /** Efface l'erreur courante. */
  clearError: () => void;
}

/**
 * 🔧 PREVIEW_MODE : mettre à `true` pour bypasser le backend et voir le design.
 * Remettre à `false` quand le backend est prêt.
 */
const PREVIEW_MODE = true;

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (PREVIEW_MODE) {
      set({
        user: { id: 'preview', email: 'preview@example.com', createdAt: new Date().toISOString() },
        isInitialized: true,
        isLoading: false,
      });
      return;
    }
    try {
      set({ isLoading: true });
      const token = await secureStorage.get(SECURE_STORE_SESSION_TOKEN_KEY);

      if (!token) {
        set({ isInitialized: true, isLoading: false });
        return;
      }

      const user = await getMe();
      set({ user, isInitialized: true, isLoading: false });
    } catch {
      logger.warn('Session invalide au démarrage, nettoyage du token');
      await secureStorage.delete(SECURE_STORE_SESSION_TOKEN_KEY);
      set({ user: null, isInitialized: true, isLoading: false });
    }
  },

  register: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const { user, sessionToken } = await registerUser(email, password);
      await secureStorage.set(SECURE_STORE_SESSION_TOKEN_KEY, sessionToken);
      set({ user, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur d\'inscription';
      set({ error: message, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const { user, sessionToken } = await loginUser(email, password);
      await secureStorage.set(SECURE_STORE_SESSION_TOKEN_KEY, sessionToken);
      set({ user, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await logoutUser();
    } catch {
      logger.warn('Erreur lors du logout, nettoyage local');
    } finally {
      await secureStorage.delete(SECURE_STORE_SESSION_TOKEN_KEY);
      set({ user: null, isLoading: false, error: null });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
