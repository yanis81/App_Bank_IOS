/**
 * Palette de couleurs de l'application.
 * Thème sombre moderne avec accents bleus.
 *
 * @module theme/colors
 */

export const colors = {
  /** Couleurs de fond */
  background: {
    primary: '#0A0E1A',
    secondary: '#111827',
    tertiary: '#1F2937',
    card: '#161E2E',
    elevated: '#1A2332',
  },

  /** Couleurs de texte */
  text: {
    primary: '#F9FAFB',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    inverse: '#111827',
    link: '#60A5FA',
  },

  /** Couleur d'accent principale */
  accent: {
    primary: '#4F78FF',
    primaryLight: '#7C9AFF',
    primaryDark: '#3B5BDB',
    secondary: '#10B981',
    secondaryLight: '#34D399',
  },

  /** Couleurs sémantiques */
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  /** Bordures et séparateurs */
  border: {
    default: '#1F2937',
    subtle: '#374151',
    focused: '#4F78FF',
  },

  /** Couleurs spécifiques aux notifications */
  notification: {
    preBadge: '#4F78FF',
    postBadge: '#10B981',
    warningBadge: '#F59E0B',
  },

  /** Transparences */
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.10)',
    dark: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

export type Colors = typeof colors;
