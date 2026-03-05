/**
 * Classe d'erreur applicative centralisée.
 * Toutes les erreurs métier et techniques doivent utiliser cette classe
 * ou une sous-classe pour un traitement uniforme.
 *
 * @module core/errors/app-error
 */

import { ErrorCode } from './error-codes';

export class AppError extends Error {
  /**
   * Crée une nouvelle erreur applicative.
   *
   * @param message - Message descriptif de l'erreur (pour les logs).
   * @param code - Code d'erreur métier identifiant le type d'erreur.
   * @param statusCode - Code HTTP associé (optionnel).
   * @param context - Données contextuelles pour le debug (optionnel).
   */
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode?: number,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  /**
   * Vérifie si une erreur inconnue est une AppError.
   *
   * @param error - L'erreur à vérifier.
   * @returns `true` si l'erreur est une instance d'AppError.
   */
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

/**
 * Erreur réseau (timeout, connexion perdue, etc.).
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Erreur de connexion réseau', context?: Record<string, unknown>) {
    super(message, ErrorCode.NETWORK, undefined, context);
    this.name = 'NetworkError';
  }
}

/**
 * Erreur d'authentification (token invalide ou expiré).
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Session expirée', context?: Record<string, unknown>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, context);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Erreur de validation des données.
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, ErrorCode.VALIDATION, 422, context);
    this.name = 'ValidationError';
  }
}
