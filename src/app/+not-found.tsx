/**
 * Écran 404 — Route non trouvée.
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';

import { Link, Stack } from 'expo-router';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🔍</Text>
        <Text style={styles.title}>Page introuvable</Text>
        <Link href="/" asChild>
          <Pressable style={styles.button} accessibilityLabel="Retour à l'accueil">
            <Text style={styles.buttonText}>Retour à l'accueil</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  button: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
  },
  buttonText: {
    ...typography.body,
    color: colors.text.link,
    textDecorationLine: 'underline',
  },
});
