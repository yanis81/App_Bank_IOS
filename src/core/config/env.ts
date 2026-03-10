/**
 * Configuration des variables d'environnement de l'application.
 * Centralise tous les accès aux constantes d'environnement.
 *
 * @module core/config/env
 */

interface EnvConfig {
  /** URL de base de l'API backend. */
  readonly API_BASE_URL: string;
  /** Clé publique Clerk pour l'authentification. */
  readonly CLERK_PUBLISHABLE_KEY: string;
  /** Indique si l'app tourne en mode développement. */
  readonly IS_DEV: boolean;
}

export const env: EnvConfig = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
  IS_DEV: __DEV__,
} as const;
