/**
 * Mappe une erreur inconnue vers un message utilisateur lisible et une action.
 *
 * @module core/errors/error-mapper
 */

import { AppError } from './app-error';
import { ErrorCode } from './error-codes';

interface UserFacingError {
  /** Message affiché à l'utilisateur. */
  readonly title: string;
  /** Description détaillée. */
  readonly message: string;
  /** Action suggérée. */
  readonly action: 'retry' | 'reconnect' | 'configure' | 'contact_support' | 'none';
}

/** Messages par défaut associés à chaque code d'erreur. */
const ERROR_MAP: Record<ErrorCode, UserFacingError> = {
  [ErrorCode.NETWORK]: {
    title: 'Connexion impossible',
    message: 'Vérifiez votre connexion internet et réessayez.',
    action: 'retry',
  },
  [ErrorCode.UNAUTHORIZED]: {
    title: 'Session expirée',
    message: 'Veuillez vous reconnecter.',
    action: 'reconnect',
  },
  [ErrorCode.BANK_CONNECTION_EXPIRED]: {
    title: 'Connexion bancaire expirée',
    message: 'Reconnectez votre compte bancaire pour continuer.',
    action: 'reconnect',
  },
  [ErrorCode.BANK_CONSENT_EXPIRING]: {
    title: 'Consentement bientôt expiré',
    message: 'Votre accès bancaire expire bientôt. Renouvelez-le pour continuer à recevoir vos soldes.',
    action: 'reconnect',
  },
  [ErrorCode.CARD_NOT_MAPPED]: {
    title: 'Carte non configurée',
    message: 'Associez cette carte à un compte bancaire dans les réglages.',
    action: 'configure',
  },
  [ErrorCode.VALIDATION]: {
    title: 'Données invalides',
    message: 'Vérifiez les informations saisies.',
    action: 'none',
  },
  [ErrorCode.NO_ACCOUNTS_CONFIGURED]: {
    title: 'Aucun compte configuré',
    message: 'Configurez au moins un compte pour recevoir les notifications.',
    action: 'configure',
  },
  [ErrorCode.SERVER]: {
    title: 'Erreur serveur',
    message: 'Un problème est survenu. Réessayez dans quelques instants.',
    action: 'retry',
  },
  [ErrorCode.UPDATE_REQUIRED]: {
    title: 'Mise à jour requise',
    message: 'Une nouvelle version de l\'app est disponible. Mettez à jour pour continuer.',
    action: 'none',
  },
  [ErrorCode.UNKNOWN]: {
    title: 'Erreur inattendue',
    message: 'Un problème est survenu. Si le problème persiste, contactez le support.',
    action: 'contact_support',
  },
};

/**
 * Mappe une erreur vers un objet affichable à l'utilisateur.
 *
 * @param error - L'erreur à mapper (AppError ou Error générique).
 * @returns Un objet contenant titre, message et action recommandée.
 */
export function mapErrorToUserFacing(error: unknown): UserFacingError {
  if (AppError.isAppError(error)) {
    return ERROR_MAP[error.code];
  }
  return ERROR_MAP[ErrorCode.UNKNOWN];
}
