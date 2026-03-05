/**
 * Implémentation du repository de soldes.
 *
 * @module data/repositories/balance-repository
 */

import * as endpoints from '@/data/api/endpoints';
import type { BalanceRepository } from '@/domain/ports';

/**
 * Repository de soldes utilisant l'API backend.
 */
export const balanceRepository: BalanceRepository = {
  getSummary: () => endpoints.getBalanceSummary(),
  getByWalletCard: (cardLabel) => endpoints.getBalanceByWalletCard(cardLabel),
};
