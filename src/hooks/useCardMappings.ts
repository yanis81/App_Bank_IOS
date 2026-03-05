/**
 * Hook d'abstraction pour les mappings carte Wallet ↔ compte bancaire.
 *
 * @module hooks/useCardMappings
 */

import { useEffect, useCallback } from 'react';

import { useBankStore } from '@/stores/bank-store';

/**
 * Fournit les mappings cartes avec opérations CRUD intégrées.
 */
export function useCardMappings() {
  const {
    cardMappings,
    isLoading,
    error,
    fetchCardMappings,
    saveCardMapping,
    removeCardMapping,
    clearError,
  } = useBankStore();

  useEffect(() => {
    fetchCardMappings();
  }, [fetchCardMappings]);

  const addMapping = useCallback(
    (walletCardLabel: string, accountId: string) => {
      return saveCardMapping(walletCardLabel, accountId);
    },
    [saveCardMapping],
  );

  const deleteMapping = useCallback(
    (mappingId: string) => {
      return removeCardMapping(mappingId);
    },
    [removeCardMapping],
  );

  return {
    cardMappings,
    isLoading,
    error,
    addMapping,
    deleteMapping,
    refetch: fetchCardMappings,
    clearError,
  } as const;
}
