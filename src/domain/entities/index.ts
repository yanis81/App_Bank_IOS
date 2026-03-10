/**
 * Entités métier du domaine.
 * Types purs sans dépendance à React Native ou à l'infrastructure.
 *
 * @module domain/entities
 */

/** Utilisateur authentifié. */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
}

/** Connexion bancaire Open Banking. */
export interface BankConnection {
  readonly id: string;
  readonly userId: string;
  readonly provider: string;
  /** Nom ASPSP de la banque (ex: "BNP Paribas"). */
  readonly aspspName: string;
  /** Code pays de la banque (ex: "FR"). */
  readonly aspspCountry: string;
  readonly status: BankConnectionStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Date d'expiration prévue du consentement (PSD2 ~90 jours). */
  readonly consentExpiresAt: string | null;
}

export type BankConnectionStatus = 'active' | 'expired' | 'revoked';

/**
 * Vérifie si une connexion bancaire est proche de l'expiration.
 *
 * @param connection - Connexion à vérifier.
 * @param warningDays - Nombre de jours avant expiration pour alerter.
 * @returns true si la connexion expire bientôt ou est déjà expirée.
 */
export function isConnectionExpiringSoon(
  connection: BankConnection,
  warningDays: number = 7,
): boolean {
  if (connection.status !== 'active') return true;
  if (!connection.consentExpiresAt) return false;

  const expiresAt = new Date(connection.consentExpiresAt);
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + warningDays);

  return expiresAt <= warningDate;
}

/**
 * Calcule le nombre de jours restants avant expiration du consentement.
 *
 * @param connection - Connexion bancaire.
 * @returns Nombre de jours restants, ou null si pas de date d'expiration.
 */
export function daysUntilExpiration(connection: BankConnection): number | null {
  if (!connection.consentExpiresAt) return null;

  const expiresAt = new Date(connection.consentExpiresAt);
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();

  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/** Compte bancaire. */
export interface BankAccount {
  readonly id: string;
  readonly userId: string;
  readonly connectionId: string;
  readonly label: string;
  readonly maskedIban: string | null;
  readonly currency: string;
  readonly createdAt: string;
}

/** Banque disponible via Enable Banking (ASPSP). */
export interface Institution {
  readonly name: string;
  readonly country: string;
  readonly bic: string;
  readonly logo: string;
}

/** Solde d'un compte bancaire. */
export interface Balance {
  readonly id: string;
  readonly accountId: string;
  readonly amount: number;
  readonly currency: string;
  readonly updatedAt: string;
  readonly fetchedAt: string;
}

/** Compte avec solde inclus (vue dashboard). */
export interface AccountWithBalance {
  readonly account: BankAccount;
  readonly balance: Balance | null;
}

/** Mapping carte Wallet ↔ compte bancaire. */
export interface WalletCardMapping {
  readonly id: string;
  readonly userId: string;
  readonly walletCardLabel: string;
  readonly accountId: string;
  readonly createdAt: string;
}

/** Réglages de notification de l'utilisateur. */
export interface NotificationSettings {
  readonly userId: string;
  readonly primaryAccountId: string | null;
  readonly secondaryAccount1Id: string | null;
  readonly secondaryAccount2Id: string | null;
  readonly refreshPerDay: 2 | 3;
  readonly privacyMode: boolean;
  readonly updatedAt: string;
}

/** Résumé des soldes pour la notification pré-paiement (3 comptes max). */
export interface BalanceSummary {
  readonly accounts: ReadonlyArray<{
    readonly label: string;
    readonly amount: number;
    readonly currency: string;
  }>;
  readonly lastUpdated: string;
}

/** Solde pour la notification post-paiement (1 compte). */
export interface WalletCardBalance {
  readonly accountLabel: string;
  readonly amount: number;
  readonly currency: string;
  readonly lastUpdated: string;
}

// ─── Audit Log ────────────────────────────────────────────────────

/** Types d'actions auditées. */
export type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'bank_connect'
  | 'bank_disconnect'
  | 'bank_consent_renewed'
  | 'settings_updated'
  | 'card_mapping_created'
  | 'card_mapping_deleted'
  | 'balances_refreshed';

/** Entrée d'audit pour traçabilité. */
export interface AuditLogEntry {
  readonly id: string;
  readonly userId: string;
  readonly action: AuditAction;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
}
