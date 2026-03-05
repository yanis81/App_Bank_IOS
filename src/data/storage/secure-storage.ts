/**
 * Service de stockage sécurisé utilisant le Keychain iOS via expo-secure-store.
 * Implémentation du port SecureStorageService.
 *
 * @module data/storage/secure-storage
 */

import * as SecureStore from 'expo-secure-store';

import { logger } from '@/core/logger';
import type { SecureStorageService } from '@/domain/ports';

/**
 * Implémentation du stockage sécurisé Keychain iOS.
 */
export const secureStorage: SecureStorageService = {
  /**
   * Stocke une valeur dans le Keychain iOS.
   *
   * @param key - Clé de stockage.
   * @param value - Valeur à stocker.
   */
  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error: unknown) {
      logger.error('Erreur stockage sécurisé (set)', { key, error: String(error) });
      throw error;
    }
  },

  /**
   * Récupère une valeur depuis le Keychain iOS.
   *
   * @param key - Clé de stockage.
   * @returns La valeur stockée ou null si inexistante.
   */
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error: unknown) {
      logger.error('Erreur stockage sécurisé (get)', { key, error: String(error) });
      return null;
    }
  },

  /**
   * Supprime une valeur du Keychain iOS.
   *
   * @param key - Clé de stockage.
   */
  async delete(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error: unknown) {
      logger.error('Erreur stockage sécurisé (delete)', { key, error: String(error) });
    }
  },
};
