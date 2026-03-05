/**
 * Hook d'abstraction pour les réglages de notification.
 *
 * @module hooks/useSettings
 */

import { useEffect, useCallback } from 'react';

import { useBankStore } from '@/stores/bank-store';
import type { NotificationSettings } from '@/domain/entities';

/**
 * Fournit les réglages avec mise à jour optimiste.
 */
export function useSettings() {
  const { notificationSettings, isLoading, error, fetchSettings, saveSettings, clearError } = useBankStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    (settings: Partial<NotificationSettings>) => {
      return saveSettings(settings);
    },
    [saveSettings],
  );

  const togglePrivacyMode = useCallback(() => {
    const current = notificationSettings?.privacyMode ?? false;
    return saveSettings({ privacyMode: !current });
  }, [notificationSettings?.privacyMode, saveSettings]);

  return {
    settings: notificationSettings,
    isPrivacyMode: notificationSettings?.privacyMode ?? false,
    isLoading,
    error,
    updateSettings,
    togglePrivacyMode,
    refetch: fetchSettings,
    clearError,
  } as const;
}
