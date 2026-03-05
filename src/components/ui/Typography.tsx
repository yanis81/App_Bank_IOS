/**
 * Composant Typography — texte stylisé selon les tokens typographiques.
 *
 * @module components/ui/Typography
 */

import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

type TypographyVariant = keyof typeof typography;

type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'link'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error';

const colorMap: Record<TextColor, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  tertiary: colors.text.tertiary,
  inverse: colors.text.inverse,
  link: colors.text.link,
  accent: colors.accent.primary,
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  error: colors.semantic.error,
};

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

/**
 * Affiche du texte avec un style prédéfini du design system.
 *
 * @param variant - Style typographique (h1, body, amount, etc.).
 * @param color - Couleur sémantique du texte.
 * @param align - Alignement horizontal.
 */
export function Typography({
  variant = 'body',
  color = 'primary',
  align,
  style,
  children,
  ...rest
}: TypographyProps) {
  return (
    <Text
      style={[
        typography[variant],
        { color: colorMap[color] },
        align ? { textAlign: align } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
