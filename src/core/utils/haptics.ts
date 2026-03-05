/**
 * Utilitaire de retour haptique.
 * Encapsule expo-haptics pour un feedback tactile natif.
 *
 * @module core/utils/haptics
 */

import * as Haptics from 'expo-haptics';

import { logger } from '@/core/logger';

/**
 * Retour haptique léger (tap bouton, sélection).
 */
export async function hapticLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error: unknown) {
    logger.debug('Haptic non disponible', { error: String(error) });
  }
}

/**
 * Retour haptique moyen (action confirmée).
 */
export async function hapticMedium(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error: unknown) {
    logger.debug('Haptic non disponible', { error: String(error) });
  }
}

/**
 * Retour haptique de succès (action complétée).
 */
export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error: unknown) {
    logger.debug('Haptic non disponible', { error: String(error) });
  }
}

/**
 * Retour haptique d'erreur.
 */
export async function hapticError(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error: unknown) {
    logger.debug('Haptic non disponible', { error: String(error) });
  }
}

/**
 * Retour haptique de sélection (toggle, switch, item listé).
 */
export async function hapticSelection(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch (error: unknown) {
    logger.debug('Haptic non disponible', { error: String(error) });
  }
}
