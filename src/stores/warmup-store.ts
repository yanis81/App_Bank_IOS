/**
 * Store de réveil serveur (warm-up Render cold start).
 * Gère le cycle de vie du ping initial au démarrage de l'app :
 * idle → warming → ready | timeout.
 *
 * @module stores/warmup-store
 */

import { create } from 'zustand';

import { pingUntilAlive } from '@/data/api/warmup';

/** États possibles du warm-up. */
export type WarmupStatus = 'idle' | 'warming' | 'ready' | 'timeout';

interface WarmupState {
  /** État courant du warm-up. */
  status: WarmupStatus;
  /** Numéro de la tentative en cours (affichage UI). */
  attempt: number;
}

interface WarmupActions {
  /**
   * Déclenche le ping serveur et met à jour le statut.
   * Idempotent : n'a aucun effet si déjà en cours ou terminé.
   */
  startWarmup: () => Promise<void>;
}

export const useWarmupStore = create<WarmupState & WarmupActions>((set, get) => ({
  status: 'idle',
  attempt: 0,

  startWarmup: async () => {
    if (get().status !== 'idle') return;

    set({ status: 'warming', attempt: 1 });

    const alive = await pingUntilAlive((attempt) => {
      set({ attempt });
    });

    set({ status: alive ? 'ready' : 'timeout', attempt: 0 });
  },
}));
