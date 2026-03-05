/**
 * Implémentation du repository bancaire.
 * Gère l'accès aux données de connexions et comptes bancaires.
 *
 * @module data/repositories/bank-repository
 */

import * as endpoints from '@/data/api/endpoints';
import type { BankRepository } from '@/domain/ports';

/**
 * Repository bancaire utilisant l'API backend.
 */
export const bankRepository: BankRepository = {
  initiateConnection: () => endpoints.initiateConnection(),
  getAccounts: () => endpoints.getBankAccounts(),
  deleteConnection: (connectionId) => endpoints.deleteBankConnection(connectionId),
  getConnections: () => endpoints.getBankConnections(),
};
