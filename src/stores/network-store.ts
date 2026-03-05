/**
 * Store de connectivité réseau.
 * Utilise NetInfo pour détecter l'état offline/online en temps réel.
 *
 * @module stores/network-store
 */

import { create } from 'zustand';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import { logger } from '@/core/logger';

interface NetworkState {
  /** true si l'appareil est connecté à Internet. */
  isConnected: boolean;
  /** true si la vérification initiale est terminée. */
  isInitialized: boolean;
}

interface NetworkActions {
  /** Initialise le listener de connectivité réseau. Retourne la fonction d'unsubscribe. */
  initialize: () => () => void;
}

export const useNetworkStore = create<NetworkState & NetworkActions>((set) => ({
  isConnected: true,
  isInitialized: false,

  initialize: () => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      logger.debug('État réseau changé', { connected, type: state.type });
      set({ isConnected: connected, isInitialized: true });
    });

    return unsubscribe;
  },
}));
