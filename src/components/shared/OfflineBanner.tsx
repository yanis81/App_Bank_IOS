/**
 * Composant bandeau offline.
 * Affiché en haut de l'écran quand la connectivité réseau est perdue.
 *
 * @module components/shared/OfflineBanner
 */

import { View, Text, StyleSheet } from 'react-native';

import { useNetworkStore } from '@/stores/network-store';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';

/**
 * Bandeau indicateur de mode hors connexion.
 * Se masque automatiquement quand le réseau revient.
 */
export function OfflineBanner() {
  const { isConnected, isInitialized } = useNetworkStore();

  if (!isInitialized || isConnected) {
    return null;
  }

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.text}>📡 Hors connexion — données en cache</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.semantic.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  text: {
    ...typography.small,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});
