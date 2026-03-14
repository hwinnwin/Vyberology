import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();
export const isIOS = (): boolean => Capacitor.getPlatform() === 'ios';
export const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';
export const isWeb = (): boolean => Capacitor.getPlatform() === 'web';

/**
 * Apply the 'native-app' class to body when running in a native shell.
 * Call this once at app startup.
 */
export function initPlatform(): void {
  if (isNative()) {
    document.body.classList.add('native-app');
  }
}
