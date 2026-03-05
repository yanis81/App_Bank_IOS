/**
 * Composant Input — champ de saisie avec label et erreur.
 *
 * @module components/ui/Input
 */

import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/shared';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Typography } from './Typography';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
}

/**
 * Champ de saisie avec label, état focus, et message d'erreur.
 *
 * @param label - Libellé affiché au-dessus du champ.
 * @param error - Message d'erreur affiché en rouge sous le champ.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Typography variant="caption" color="secondary" style={styles.label}>
        {label}
      </Typography>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={label}
        style={[
          styles.input,
          isFocused && styles.focused,
          error ? styles.error : undefined,
          !editable && styles.disabled,
        ]}
      />
      {error ? (
        <Typography variant="small" color="error" style={styles.errorText}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    marginLeft: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  focused: {
    borderColor: colors.border.focused,
  },
  error: {
    borderColor: colors.semantic.error,
  },
  disabled: {
    opacity: 0.6,
  },
  errorText: {
    marginLeft: spacing.xs,
  },
});
