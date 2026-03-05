/**
 * Store et composant de notifications Toast in-app.
 * Système de messages éphémères remplaçant les Alert natives.
 *
 * @module stores/toast-store
 */

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  readonly id: string;
  readonly message: string;
  readonly type: ToastType;
  readonly duration: number;
}

interface ToastState {
  /** Toast actuellement affiché (un seul à la fois). */
  toast: Toast | null;
}

interface ToastActions {
  /** Affiche un toast. */
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  /** Masque le toast courant. */
  hideToast: () => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState & ToastActions>((set) => ({
  toast: null,

  showToast: (message, type = 'info', duration = 3000) => {
    const id = String(++toastCounter);
    set({ toast: { id, message, type, duration } });
  },

  hideToast: () => {
    set({ toast: null });
  },
}));

/**
 * Raccourcis pour afficher des toasts depuis n'importe où.
 */
export const toast = {
  success: (message: string) => useToastStore.getState().showToast(message, 'success'),
  error: (message: string) => useToastStore.getState().showToast(message, 'error', 4000),
  info: (message: string) => useToastStore.getState().showToast(message, 'info'),
  warning: (message: string) => useToastStore.getState().showToast(message, 'warning'),
} as const;
