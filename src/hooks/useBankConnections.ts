/**
 * Hook d'abstraction pour les connexions bancaires.
 * Gère le fetch, le renouvellement de consentement et la détection d'expiration.
 *
 * @module hooks/useBankConnections
 */

import { useEffect, useCallback } from 'react';

import { useBankStore } from '@/stores/bank-store';
import { isConnectionExpiringSoon } from '@/domain/entities';

/**
 * Fournit les connexions bancaires avec détection automatique d'expiration.
 */
export function useBankConnections() {
  const { connections, isLoading, error, fetchConnections, renewConsent, clearError } = useBankStore();

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const expiringConnections = connections.filter(isConnectionExpiringSoon);
  const hasExpiringConnections = expiringConnections.length > 0;

  const handleRenewConsent = useCallback(async (connectionId: string) => {
    return renewConsent(connectionId);
  }, [renewConsent]);

  return {
    connections,
    expiringConnections,
    hasExpiringConnections,
    isLoading,
    error,
    renewConsent: handleRenewConsent,
    refetch: fetchConnections,
    clearError,
  } as const;
}
