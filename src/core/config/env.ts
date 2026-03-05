/**
 * Configuration des variables d'environnement de l'application.
 * Centralise tous les accès aux constantes d'environnement.
 *
 * @module core/config/env
 */

import Constants from 'expo-constants';

interface EnvConfig {
  readonly API_BASE_URL: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly IS_DEV: boolean;
}

/**
 * Récupère une variable d'environnement depuis les extra d'Expo.
 *
 * @param key - Clé de la variable d'environnement.
 * @param fallback - Valeur par défaut si la variable n'est pas définie.
 * @returns La valeur de la variable d'environnement.
 */
function getEnvVar(key: string, fallback: string = ''): string {
  const extras = Constants.expoConfig?.extra;
  if (extras && typeof extras === 'object' && key in extras) {
    return String(extras[key]);
  }
  return fallback;
}

export const env: EnvConfig = {
  API_BASE_URL: getEnvVar('API_BASE_URL', 'http://localhost:8080'),
  SUPABASE_URL: getEnvVar('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY'),
  IS_DEV: __DEV__,
} as const;
