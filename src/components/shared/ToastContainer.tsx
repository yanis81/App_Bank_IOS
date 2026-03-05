/**
 * Composant Toast — notification in-app éphémère.
 * Affiché en haut de l'écran avec animation slide-in.
 *
 * @module components/shared/ToastContainer
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore, type ToastType } from '@/stores/toast-store';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/shared';

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: colors.semantic.success,
  error: colors.semantic.error,
  info: colors.semantic.info,
  warning: colors.semantic.warning,
};

/**
 * Conteneur de Toast. Doit être placé une seule fois dans le root layout.
 * Gère l'animation d'apparition/disparition et l'auto-hide.
 */
export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const { toast, hideToast } = useToastStore();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => hideToast());
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast, translateY, opacity, hideToast]);

  if (!toast) return null;

  const accentColor = TOAST_COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + spacing.sm,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[styles.toast, { borderLeftColor: accentColor }]}
        onPress={hideToast}
        accessibilityRole="alert"
      >
        <View style={[styles.iconContainer, { backgroundColor: accentColor }]}>
          <Text style={styles.icon}>{TOAST_ICONS[toast.type]}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
});
