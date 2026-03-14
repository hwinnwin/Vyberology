import { isNative, isAndroid } from './platform';

/**
 * Trigger haptic feedback on native platforms.
 * No-op on web.
 */
export async function hapticTap(): Promise<void> {
  if (!isNative()) return;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  await Haptics.impact({ style: ImpactStyle.Light });
}

/**
 * Share content via native share sheet, falling back to clipboard on web.
 */
export async function nativeShare(data: { title: string; text: string; url?: string }): Promise<boolean> {
  if (isNative()) {
    const { Share } = await import('@capacitor/share');
    await Share.share(data);
    return true;
  }
  if (navigator.share) {
    await navigator.share(data);
    return true;
  }
  return false;
}

/**
 * Open a URL in the in-app browser (native) or new tab (web).
 */
export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

/**
 * Register Android back button handler.
 * Call once at app startup.
 */
export async function registerBackButton(onBack: () => void): Promise<void> {
  if (!isAndroid()) return;
  const { App } = await import('@capacitor/app');
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      onBack();
    } else {
      App.exitApp();
    }
  });
}
