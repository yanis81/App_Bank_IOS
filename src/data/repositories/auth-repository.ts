/**
 * Implémentation du repository d'authentification.
 * Délègue les appels réseau au client API.
 *
 * @module data/repositories/auth-repository
 */

import * as endpoints from '@/data/api/endpoints';
import type { AuthRepository } from '@/domain/ports';

/**
 * Repository d'authentification utilisant l'API backend.
 */
export const authRepository: AuthRepository = {
  register: (email, password) => endpoints.registerUser(email, password),
  login: (email, password) => endpoints.loginUser(email, password),
  logout: () => endpoints.logoutUser(),
  getMe: () => endpoints.getMe(),
};
