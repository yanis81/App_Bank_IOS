/**
 * Codes d'erreur métier de l'application.
 * Chaque code correspond à un type d'erreur identifiable et traitable.
 *
 * @module core/errors/error-codes
 */
export enum ErrorCode {
  /** Erreur réseau (timeout, connexion perdue). */
  NETWORK = 'NETWORK',
  /** Token de session invalide ou expiré. */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** Connexion bancaire expirée ou révoquée. */
  BANK_CONNECTION_EXPIRED = 'BANK_CONNECTION_EXPIRED',
  /** Consentement bancaire proche de l'expiration (PSD2 ~90 jours). */
  BANK_CONSENT_EXPIRING = 'BANK_CONSENT_EXPIRING',
  /** Carte Wallet non associée à un compte bancaire. */
  CARD_NOT_MAPPED = 'CARD_NOT_MAPPED',
  /** Erreur de validation des données. */
  VALIDATION = 'VALIDATION',
  /** Aucun compte configuré pour les notifications. */
  NO_ACCOUNTS_CONFIGURED = 'NO_ACCOUNTS_CONFIGURED',
  /** Erreur serveur. */
  SERVER = 'SERVER',
  /** Mise à jour de l'app requise (API dépréciée). */
  UPDATE_REQUIRED = 'UPDATE_REQUIRED',
  /** Erreur inconnue. */
  UNKNOWN = 'UNKNOWN',
}
