/**
 * Écran de guide d'installation des automatisations iOS.
 * Guide pas-à-pas pour configurer les raccourcis dans l'app Raccourcis.
 */

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

import { useRouter } from 'expo-router';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

interface StepProps {
  readonly number: number;
  readonly title: string;
  readonly description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function AutomationGuideScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityLabel="Retour"
      >
        <Text style={styles.backText}>← Retour</Text>
      </Pressable>

      <Text style={styles.title}>Configuration automatisations</Text>
      <Text style={styles.subtitle}>
        Suivez ces étapes pour recevoir vos soldes automatiquement.
      </Text>

      {/* Automatisation PRÉ-paiement */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>💳</Text>
          <Text style={styles.sectionTitle}>Avant paiement</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Affiche vos soldes quand vous ouvrez Apple Wallet.
        </Text>

        <View style={styles.steps}>
          <Step
            number={1}
            title="Ouvrez Raccourcis"
            description="Allez dans l'onglet Automatisations."
          />
          <Step
            number={2}
            title='Nouvelle automatisation'
            description='Appuyez sur "+" en haut à droite.'
          />
          <Step
            number={3}
            title="Trigger : App"
            description='Choisissez "App" → sélectionnez "Wallet" → "Est ouverte".'
          />
          <Step
            number={4}
            title="Action"
            description='Recherchez "Wallet Balance Assistant" → choisissez "Afficher soldes pré-paiement".'
          />
          <Step
            number={5}
            title="Exécution immédiate"
            description='Activez "Exécuter immédiatement" et désactivez la confirmation.'
          />
        </View>
      </View>

      {/* Automatisation POST-paiement */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>✅</Text>
          <Text style={styles.sectionTitle}>Après paiement</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Affiche le solde du compte après un paiement Apple Pay.
        </Text>

        <View style={styles.steps}>
          <Step
            number={1}
            title="Nouvelle automatisation"
            description='Onglet Automatisations → "+".'
          />
          <Step
            number={2}
            title="Trigger : Transaction"
            description='Choisissez "Transaction" → sélectionnez votre carte.'
          />
          <Step
            number={3}
            title="Action"
            description='Recherchez "Wallet Balance Assistant" → choisissez "Afficher solde post-paiement".'
          />
          <Step
            number={4}
            title="Paramètre carte"
            description="Le nom de la carte sera automatiquement renseigné."
          />
          <Step
            number={5}
            title="Exécution immédiate"
            description='Activez "Exécuter immédiatement" et désactivez la confirmation.'
          />
        </View>
      </View>

      <Pressable
        style={styles.doneButton}
        onPress={() => router.replace('/(main)')}
        accessibilityLabel="Terminer la configuration"
      >
        <Text style={styles.doneButtonText}>Terminé</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  contentContainer: {
    paddingBottom: spacing['5xl'],
  },
  backButton: {
    paddingTop: spacing['5xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.text.link,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing['2xl'],
  },
  section: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing['2xl'],
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionEmoji: {
    fontSize: 24,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  steps: {
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    ...typography.small,
    color: colors.text.primary,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  stepTitle: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  stepDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  doneButton: {
    backgroundColor: colors.accent.primary,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  doneButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
});
