/**
 * Tokens typographiques de l'application.
 * Utilise la police système iOS (SF Pro) par défaut.
 *
 * @module theme/typography
 */

import { TextStyle } from 'react-native';

export const typography = {
  /** Titre principal (32px, bold) */
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.5,
  } satisfies TextStyle,

  /** Titre secondaire (24px, semibold) */
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.3,
  } satisfies TextStyle,

  /** Titre tertiaire (20px, semibold) */
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.2,
  } satisfies TextStyle,

  /** Corps de texte principal (16px) */
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } satisfies TextStyle,

  /** Corps de texte en gras */
  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  } satisfies TextStyle,

  /** Texte secondaire (14px) */
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } satisfies TextStyle,

  /** Texte très petit (12px) */
  small: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } satisfies TextStyle,

  /** Label de bouton (16px, semibold) */
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  } satisfies TextStyle,

  /** Montant monétaire (28px, bold, tabular nums) */
  amount: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  } satisfies TextStyle,

  /** Montant compact (20px) */
  amountSmall: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;

export type Typography = typeof typography;
