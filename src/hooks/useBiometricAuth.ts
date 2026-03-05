/**
 * Hook de gestion de l'authentification biométrique (Face ID / Touch ID).
 * Vérifie la disponibilité, demande l'authentification et gère le stockage du setting.
 *
 * @module hooks/useBiometricAuth
 */

import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

import { secureStorage } from '@/data/storage/secure-storage';
import { logger } from '@/core/logger';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

interface BiometricAuthState {
  /** true si le device supporte la biométrie. */
  isAvailable: boolean;
  /** Type de biométrie disponible (Face ID, Touch ID, etc.). */
  biometricType: string | null;
  /** true si l'utilisateur a activé la biométrie dans les settings. */
  isEnabled: boolean;
  /** true pendant la vérification initiale. */
  isLoading: boolean;
}

interface BiometricAuthActions {
  /** Lance l'authentification biométrique. Retourne true si réussie. */
  authenticate: () => Promise<boolean>;
  /** Active/désactive la biométrie. */
  setEnabled: (enabled: boolean) => Promise<void>;
}

/**
 * Gère l'authentification biométrique de l'app.
 * Vérifie la compatibilité et expose les actions d'auth.
 */
export function useBiometricAuth(): BiometricAuthState & BiometricAuthActions {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isEnabled, setIsEnabledState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBiometrics() {
      try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const available = compatible && enrolled;
        setIsAvailable(available);

        if (available) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Touch ID');
          } else {
            setBiometricType('Biométrie');
          }
        }

        const storedPref = await secureStorage.get(BIOMETRIC_ENABLED_KEY);
        setIsEnabledState(storedPref === 'true');
      } catch (error: unknown) {
        logger.error('Erreur vérification biométrie', { error: String(error) });
      } finally {
        setIsLoading(false);
      }
    }

    checkBiometrics();
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Vérifiez votre identité',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
        fallbackLabel: 'Utiliser le code',
      });

      return result.success;
    } catch (error: unknown) {
      logger.error('Erreur authentification biométrique', { error: String(error) });
      return false;
    }
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const success = await authenticate();
      if (!success) return;
    }
    await secureStorage.set(BIOMETRIC_ENABLED_KEY, String(enabled));
    setIsEnabledState(enabled);
  }, [authenticate]);

  return {
    isAvailable,
    biometricType,
    isEnabled,
    isLoading,
    authenticate,
    setEnabled,
  };
}
