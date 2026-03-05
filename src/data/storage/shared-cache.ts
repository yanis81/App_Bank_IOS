/**
 * Service de cache partagé via UserDefaults (App Group).
 * Permet aux App Intents Swift d'accéder aux dernières données de soldes
 * même sans réseau (fallback offline).
 *
 * Note : ce module utilise expo-secure-store pour le stockage partagé
 * via l'App Group. Les données de soldes ne sont pas sensibles (pas de
 * token), donc un cache en clair est acceptable ici.
 *
 * @module data/storage/shared-cache
 */

import { logger } from '@/core/logger';
import {
  SECURE_STORE_BALANCES_CACHE_KEY,
} from '@/core/config/constants';
import { secureStorage } from './secure-storage';
import type { BalanceSummary } from '@/domain/entities';

/**
 * Sauvegarde le résumé des soldes dans le cache partagé.
 * Accessible par les App Intents Swift via l'App Group Keychain.
 *
 * @param summary - Résumé des soldes à mettre en cache.
 */
export async function cacheBalanceSummary(summary: BalanceSummary): Promise<void> {
  try {
    const data = JSON.stringify({
      ...summary,
      cachedAt: new Date().toISOString(),
    });
    await secureStorage.set(SECURE_STORE_BALANCES_CACHE_KEY, data);
    logger.debug('Cache des soldes mis à jour');
  } catch (error: unknown) {
    logger.error('Erreur mise en cache des soldes', { error: String(error) });
  }
}

/**
 * Récupère le résumé des soldes depuis le cache local.
 * Utilisé comme fallback quand l'API est indisponible.
 *
 * @returns Le résumé des soldes en cache ou null.
 */
export async function getCachedBalanceSummary(): Promise<(BalanceSummary & { cachedAt: string }) | null> {
  try {
    const data = await secureStorage.get(SECURE_STORE_BALANCES_CACHE_KEY);
    if (!data) return null;

    return JSON.parse(data) as BalanceSummary & { cachedAt: string };
  } catch (error: unknown) {
    logger.error('Erreur lecture cache des soldes', { error: String(error) });
    return null;
  }
}

/**
 * Supprime le cache des soldes.
 */
export async function clearBalanceCache(): Promise<void> {
  try {
    await secureStorage.delete(SECURE_STORE_BALANCES_CACHE_KEY);
  } catch (error: unknown) {
    logger.error('Erreur suppression cache soldes', { error: String(error) });
  }
}
