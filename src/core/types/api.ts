/**
 * Types de réponse API génériques.
 *
 * @module core/types/api
 */

/** Réponse API avec données typées. */
export interface ApiResponse<T> {
  readonly data: T;
  readonly success: true;
}

/** Réponse API en cas d'erreur. */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

/** Union des réponses possibles. */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/** Options de pagination. */
export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
}
