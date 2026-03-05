/**
 * Hook d'abstraction pour les soldes bancaires.
 * Encapsule le fetch, le cache fallback et les états loading/error.
 *
 * @module hooks/useBalanceSummary
 */

import { useEffect, useCallback } from 'react';

import { useBankStore } from '@/stores/bank-store';

/**
 * Fournit les données de soldes avec gestion automatique du chargement.
 * Déclenche un fetch au montage et expose un refetch pour pull-to-refresh.
 */
export function useBalanceSummary() {
  const { balanceSummary, isLoading, error, fetchBalanceSummary, clearError } = useBankStore();

  useEffect(() => {
    fetchBalanceSummary();
  }, [fetchBalanceSummary]);

  const refetch = useCallback(() => {
    fetchBalanceSummary();
  }, [fetchBalanceSummary]);

  return {
    balanceSummary,
    isLoading,
    error,
    refetch,
    clearError,
  } as const;
}
