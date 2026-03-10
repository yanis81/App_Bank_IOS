/**
 * Écran d'inscription avec Clerk v3.
 * Formulaire email + mot de passe + vérification par code email (Signal API).
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

import { useRouter } from 'expo-router';

import { useSignUp } from '@clerk/expo';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Soumet le formulaire d'inscription et envoie le code de vérification. */
  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const createResult = await signUp.create({ emailAddress: email.trim() });
      if (createResult.error) {
        setError(createResult.error.message ?? 'Erreur d\'inscription');
        return;
      }

      const passwordResult = await signUp.password({ password });
      if (passwordResult.error) {
        setError(passwordResult.error.message ?? 'Mot de passe invalide');
        return;
      }

      const sendCodeResult = await signUp.verifications.sendEmailCode();
      if (sendCodeResult.error) {
        setError(sendCodeResult.error.message ?? 'Impossible d\'envoyer le code');
        return;
      }

      setPendingVerification(true);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const clerkErr = err as { errors: Array<{ message: string }> };
        setError(clerkErr.errors[0]?.message ?? 'Erreur d\'inscription');
      } else {
        setError('Erreur d\'inscription. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signUp]);

  /** Vérifie le code email et finalise l'inscription. */
  const handleVerify = useCallback(async () => {
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const verifyResult = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (verifyResult.error) {
        setError(verifyResult.error.message ?? 'Code invalide');
        return;
      }

      if (signUp.status === 'complete') {
        const finalizeResult = await signUp.finalize();
        if (finalizeResult.error) {
          setError(finalizeResult.error.message ?? 'Erreur de finalisation');
        }
      } else {
        setError('Vérification incomplète. Veuillez réessayer.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const clerkErr = err as { errors: Array<{ message: string }> };
        setError(clerkErr.errors[0]?.message ?? 'Code invalide');
      } else {
        setError('Code invalide. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, signUp]);

  /** Renvoie le code de vérification. */
  const handleResendCode = useCallback(async () => {
    setError(null);

    try {
      const result = await signUp.verifications.sendEmailCode();
      if (result.error) {
        setError(result.error.message ?? 'Impossible de renvoyer le code.');
      }
    } catch {
      setError('Impossible de renvoyer le code.');
    }
  }, [signUp]);

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.emoji}>📧</Text>
            <Text style={styles.title}>Vérification</Text>
            <Text style={styles.subtitle}>
              Entrez le code envoyé à {email}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Code de vérification</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                editable={!isLoading}
                accessibilityLabel="Code de vérification"
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleVerify}
              disabled={isLoading || !code.trim()}
              accessibilityLabel="Vérifier"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text.primary} />
              ) : (
                <Text style={styles.submitButtonText}>Vérifier</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.resendButton}
              onPress={handleResendCode}
            >
              <Text style={styles.toggleText}>Renvoyer le code</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>💳</Text>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Inscrivez-vous pour commencer</Text>
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
              autoComplete="new-password"
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
            disabled={isLoading || !email.trim() || !password.trim()}
            accessibilityLabel="S'inscrire"
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.submitButtonText}>S'inscrire</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          style={styles.toggleButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.toggleText}>Déjà un compte ? Se connecter</Text>
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
    textAlign: 'center',
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
  resendButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  toggleText: {
    ...typography.caption,
    color: colors.text.link,
  },
});
