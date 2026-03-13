/**
 * Utilitaire de réveil du serveur Render (cold start).
 *
 * Render Free Tier endort le backend après 15 min d'inactivité.
 * Ce module pinge `GET /health` en boucle jusqu'à obtenir une réponse,
 * avec un délai entre chaque tentative pour laisser le temps au conteneur
 * de démarrer (~30-50 secondes en pratique).
 *
 * @module data/api/warmup
 */

import { env } from '@/core/config/env';
import { logger } from '@/core/logger';

const HEALTH_URL = `${env.API_BASE_URL}/health`;
const PING_TIMEOUT_MS = 8_000;
const PING_INTERVAL_MS = 5_000;
const MAX_ATTEMPTS = 12; // 12 × 5s = 60s max

/**
 * Tente un ping unique vers `/health`.
 * @returns `true` si le serveur a répondu avec HTTP 200.
 */
async function ping(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

  try {
    const response = await fetch(HEALTH_URL, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Pinge le serveur jusqu'à ce qu'il réponde ou que le nombre maximum
 * de tentatives soit atteint.
 *
 * @param onAttempt - Callback appelé à chaque tentative (numéro de l'essai).
 * @returns `true` si le serveur est prêt, `false` si timeout dépassé.
 */
export async function pingUntilAlive(onAttempt?: (attempt: number) => void): Promise<boolean> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    onAttempt?.(attempt);
    logger.debug('Ping serveur', { attempt, max: MAX_ATTEMPTS, url: HEALTH_URL });

    const alive = await ping();
    if (alive) {
      logger.info('Serveur prêt', { attempt });
      return true;
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise<void>((resolve) => setTimeout(resolve, PING_INTERVAL_MS));
    }
  }

  logger.warn('Serveur injoignable après timeout warmup', { attempts: MAX_ATTEMPTS });
  return false;
}
