/**
 * Écran de connexion / inscription.
 * Formulaire email + mot de passe avec basculement inscription / connexion.
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import { useAuthStore } from '@/stores/auth-store';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;

    if (isRegisterMode) {
      await register(email.trim(), password);
    } else {
      await login(email.trim(), password);
    }
  }, [email, password, isRegisterMode, login, register]);

  const toggleMode = useCallback(() => {
    clearError();
    setIsRegisterMode((prev) => !prev);
  }, [clearError]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💳</Text>
          <Text style={styles.title}>
            {isRegisterMode ? 'Créer un compte' : 'Connexion'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegisterMode
              ? 'Inscrivez-vous pour commencer'
              : 'Connectez-vous à votre compte'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel="Adresse email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.text.tertiary}
              secureTextEntry
              autoComplete="password"
              editable={!isLoading}
              accessibilityLabel="Mot de passe"
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            accessibilityLabel={isRegisterMode ? "S'inscrire" : 'Se connecter'}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isRegisterMode ? "S'inscrire" : 'Se connecter'}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable style={styles.toggleButton} onPress={toggleMode}>
          <Text style={styles.toggleText}>
            {isRegisterMode
              ? 'Déjà un compte ? Se connecter'
              : "Pas de compte ? S'inscrire"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.semantic.error,
  },
  submitButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    padding: spacing.sm,
  },
  toggleText: {
    ...typography.caption,
    color: colors.text.link,
  },
});
