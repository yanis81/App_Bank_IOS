/**
 * Implémentation du repository de réglages.
 *
 * @module data/repositories/settings-repository
 */

import * as endpoints from '@/data/api/endpoints';
import type { SettingsRepository } from '@/domain/ports';

/**
 * Repository de réglages utilisant l'API backend.
 */
export const settingsRepository: SettingsRepository = {
  getSettings: () => endpoints.getNotificationSettings(),
  updateSettings: (settings) => endpoints.updateNotificationSettings(settings),
};
