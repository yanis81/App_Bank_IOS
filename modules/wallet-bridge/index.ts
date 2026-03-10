import { requireNativeModule } from 'expo-modules-core';

/** Types pour le module natif WalletBridge. */
interface WalletBridgeNativeModule {
  setCachedBalances(jsonString: string): boolean;
  getCachedBalances(): string | null;
  getCacheTimestamp(): number;
  setSharedToken(token: string): boolean;
  getSharedToken(): string | null;
  deleteSharedToken(): boolean;
  isAvailable(): boolean;
}

const NativeModule = requireNativeModule<WalletBridgeNativeModule>('WalletBridge');

export default NativeModule;
