/**
 * Tokens de rayon, ombres et autres styles partagés.
 *
 * @module theme/shared
 */

import { ViewStyle } from 'react-native';

export const radius = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 9999px — arrondi complet */
  full: 9999,
} as const;

export const shadows = {
  /** Ombre légère pour les cartes. */
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  } satisfies ViewStyle,

  /** Ombre plus prononcée pour les éléments surélevés. */
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  } satisfies ViewStyle,
} as const;
