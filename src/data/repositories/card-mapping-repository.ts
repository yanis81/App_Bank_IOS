/**
 * Implémentation du repository de mapping cartes Wallet.
 *
 * @module data/repositories/card-mapping-repository
 */

import * as endpoints from '@/data/api/endpoints';
import type { CardMappingRepository } from '@/domain/ports';

/**
 * Repository de mapping cartes utilisant l'API backend.
 */
export const cardMappingRepository: CardMappingRepository = {
  getMappings: () => endpoints.getCardMappings(),
  upsertMapping: (walletCardLabel, accountId) =>
    endpoints.upsertCardMapping(walletCardLabel, accountId),
  deleteMapping: (mappingId) => endpoints.deleteCardMapping(mappingId),
};
