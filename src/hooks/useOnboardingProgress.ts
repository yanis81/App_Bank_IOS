/**
 * Hook de progression de l'onboarding.
 * Détermine quelles étapes de configuration l'utilisateur a complétées
 * pour afficher des CTA contextuels sur le dashboard.
 *
 * @module hooks/useOnboardingProgress
 */

import { useBankStore } from '@/stores/bank-store';

export interface OnboardingStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly emoji: string;
  readonly route: string;
  readonly isCompleted: boolean;
}

interface OnboardingProgress {
  /** Étapes restantes à compléter. */
  readonly pendingSteps: OnboardingStep[];
  /** Nombre total d'étapes. */
  readonly totalSteps: number;
  /** Nombre d'étapes complétées. */
  readonly completedSteps: number;
  /** Pourcentage de progression (0-100). */
  readonly progressPercent: number;
  /** true si toutes les étapes sont complétées. */
  readonly isFullyConfigured: boolean;
}

/**
 * Calcule la progression de l'onboarding en analysant l'état du store.
 * Permet au dashboard d'afficher des CTA contextuels plutôt qu'un tunnel.
 *
 * @returns L'état de progression avec les étapes restantes.
 */
export function useOnboardingProgress(): OnboardingProgress {
  const { accounts, cardMappings, notificationSettings } = useBankStore();

  const steps: OnboardingStep[] = [
    {
      id: 'bank',
      title: 'Connecter votre banque',
      description: 'Liez votre compte via Open Banking pour voir vos soldes.',
      emoji: '🏦',
      route: '/(main)/bank-connection',
      isCompleted: accounts.length > 0,
    },
    {
      id: 'accounts',
      title: 'Choisir vos comptes',
      description: 'Sélectionnez les comptes à afficher dans les notifications.',
      emoji: '📋',
      route: '/(main)/account-selection',
      isCompleted: notificationSettings?.primaryAccountId !== null && notificationSettings?.primaryAccountId !== undefined,
    },
    {
      id: 'cards',
      title: 'Associer vos cartes',
      description: 'Mappez vos cartes Wallet aux comptes pour le suivi post-paiement.',
      emoji: '💳',
      route: '/(main)/card-mapping',
      isCompleted: cardMappings.length > 0,
    },
    {
      id: 'automation',
      title: 'Configurer les automatisations',
      description: 'Activez les notifications automatiques dans Raccourcis.',
      emoji: '⚡',
      route: '/(main)/automation-guide',
      isCompleted: false, // Pas détectable côté client — marqué manuellement via settings
    },
  ];

  const completedSteps = steps.filter((s) => s.isCompleted).length;
  const pendingSteps = steps.filter((s) => !s.isCompleted);

  return {
    pendingSteps,
    totalSteps: steps.length,
    completedSteps,
    progressPercent: Math.round((completedSteps / steps.length) * 100),
    isFullyConfigured: pendingSteps.length === 0,
  };
}
