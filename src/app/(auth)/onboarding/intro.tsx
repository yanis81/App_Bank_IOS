/**
 * Écran d'introduction — Onboarding en 3 slides.
 * Présente les fonctionnalités clés de l'app avant l'inscription.
 */

import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  type ViewToken,
} from 'react-native';

import { useRouter } from 'expo-router';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  readonly id: string;
  readonly emoji: string;
  readonly title: string;
  readonly description: string;
}

const SLIDES: readonly OnboardingSlide[] = [
  {
    id: '1',
    emoji: '💳',
    title: 'Soldes avant paiement',
    description: 'Consultez vos soldes bancaires instantanément avant chaque paiement Apple Pay.',
  },
  {
    id: '2',
    emoji: '✅',
    title: 'Suivi post-paiement',
    description: 'Recevez une notification avec votre solde mis à jour après chaque transaction.',
  },
  {
    id: '3',
    emoji: '🔒',
    title: 'Sécurisé & privé',
    description: 'Vos données sont chiffrées et stockées de manière sécurisée. Aucun accès sans votre autorisation.',
  },
] as const;

export default function OnboardingIntroScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<OnboardingSlide>[] }) => {
      if (viewableItems[0]?.index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      router.replace('/(auth)/login');
    }
  }, [activeIndex, router]);

  const handleSkip = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  const renderItem = useCallback(({ item }: { item: OnboardingSlide }) => (
    <View style={styles.slide}>
      <Text style={styles.slideEmoji}>{item.emoji}</Text>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  ), []);

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <Pressable style={styles.skipButton} onPress={handleSkip} accessibilityLabel="Passer l'introduction">
        <Text style={styles.skipText}>Passer</Text>
      </Pressable>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((slide, index) => (
            <View
              key={slide.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityLabel={isLastSlide ? 'Commencer' : 'Suivant'}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Commencer' : 'Suivant'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  skipButton: {
    position: 'absolute',
    top: spacing['5xl'],
    right: spacing.xl,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  slideEmoji: {
    fontSize: 72,
    marginBottom: spacing['3xl'],
  },
  slideTitle: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  slideDescription: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['5xl'],
    gap: spacing['2xl'],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border.default,
  },
  dotActive: {
    backgroundColor: colors.accent.primary,
    width: 24,
  },
  nextButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  nextButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
});
