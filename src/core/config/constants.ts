/**
 * Constantes globales de l'application.
 *
 * @module core/config/constants
 */

/** Nombre maximum de comptes affichés dans la notification pré-paiement. */
export const MAX_NOTIFICATION_ACCOUNTS = 3;

/** Durée du timeout réseau en millisecondes. */
export const NETWORK_TIMEOUT_MS = 10_000;

/** Nombre maximum de tentatives de retry réseau. */
export const MAX_RETRY_ATTEMPTS = 2;

/** Durée de base pour le backoff exponentiel (en ms). */
export const RETRY_BASE_DELAY_MS = 1_000;

/** Clé de stockage sécurisé pour le session token. */
export const SECURE_STORE_SESSION_TOKEN_KEY = 'session_token';

/** Clé de stockage sécurisé pour le cache des soldes. */
export const SECURE_STORE_BALANCES_CACHE_KEY = 'balances_cache';

/** Préfixe pour les endpoints API. */
export const API_V1_PREFIX = '/api/v1';

/** Version du client API envoyée dans les headers. */
export const API_CLIENT_VERSION = '1.0.0';

/** Options de refresh par jour disponibles. */
export const REFRESH_OPTIONS = [2, 3] as const;

/** Version de l'application. */
export const APP_VERSION = '1.0.0';

/** Identifiant de l'App Group partagé (Keychain + UserDefaults). */
export const APP_GROUP_ID = 'group.com.walletbalance.assistant';

/** Clé UserDefaults pour le cache des soldes (App Intents fallback). */
export const SHARED_DEFAULTS_BALANCE_KEY = 'cached_balance_summary';

/** Clé UserDefaults pour le timestamp du dernier refresh. */
export const SHARED_DEFAULTS_LAST_UPDATED_KEY = 'balance_last_updated';

/** Durée d'expiration du consentement GoCardless (en jours). */
export const GOCARDLESS_CONSENT_EXPIRY_DAYS = 90;

/** Seuil d'alerte d'expiration du consentement (en jours). */
export const GOCARDLESS_CONSENT_WARNING_DAYS = 7;
