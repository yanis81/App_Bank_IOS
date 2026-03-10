/**
 * Repository d'authentification.
 * Avec Clerk, seul getMe() est nécessaire côté backend.
 *
 * @module data/repositories/auth-repository
 */

import * as endpoints from '@/data/api/endpoints';

export const authRepository = {
  getMe: () => endpoints.getMe(),
};
