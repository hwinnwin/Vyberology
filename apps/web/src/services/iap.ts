import { isNative } from '@/lib/platform';

/**
 * Initialize RevenueCat SDK.
 * Call once at app startup on native platforms.
 */
export async function initIAP(): Promise<void> {
  if (!isNative()) return;

  const apiKey = import.meta.env.VITE_REVENUECAT_API_KEY;
  if (!apiKey) {
    console.warn('RevenueCat API key not configured');
    return;
  }

  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  await Purchases.configure({ apiKey });
}

/**
 * Set the RevenueCat user ID to match the Supabase auth user.
 * Call after authentication.
 */
export async function setIAPUserId(userId: string): Promise<void> {
  if (!isNative()) return;
  const { Purchases } = await import('@revenuecat/purchases-capacitor');
  await Purchases.logIn({ appUserID: userId });
}

/**
 * Purchase a consumable product via native IAP.
 * Returns true if purchase succeeded, false if cancelled.
 */
export async function purchaseProduct(productId: string): Promise<boolean> {
  if (!isNative()) return false;

  const { Purchases } = await import('@revenuecat/purchases-capacitor');

  try {
    const { products } = await Purchases.getProducts({
      productIdentifiers: [productId],
    });

    if (products.length === 0) {
      throw new Error(`Product ${productId} not found in store`);
    }

    await Purchases.purchaseStoreProduct({ product: products[0] });
    return true;
  } catch (error: any) {
    if (error.userCancelled) return false;
    throw error;
  }
}

/**
 * Map tier IDs to store product IDs.
 */
export const TIER_TO_PRODUCT_ID: Record<string, string> = {
  'lyf-path': 'com.vyberology.lyf_path',
  'full-vybe': 'com.vyberology.full_vybe',
  deep: 'com.vyberology.deep_attunement',
  'lumyn-pro': 'com.vyberology.lumyn_pro',  // subscription product
};

/**
 * Purchase a subscription product via RevenueCat offering.
 * Returns true if purchase succeeded, false if cancelled.
 * NOTE: Lumyn Pro subscription UI is web-first — this function exists
 * for future native enablement only.
 */
export async function purchaseSubscription(productId: string): Promise<boolean> {
  if (!isNative()) return false

  const { Purchases } = await import('@revenuecat/purchases-capacitor')

  try {
    const { offerings } = await Purchases.getOfferings()
    const currentOffering = offerings.current
    if (!currentOffering) throw new Error('No current offering available')

    const pkg = currentOffering.availablePackages.find(
      p => p.product.identifier === productId
    )
    if (!pkg) throw new Error(`Package ${productId} not found in offering`)

    await Purchases.purchasePackage({ aPackage: pkg })
    return true
  } catch (error: any) {
    if (error.userCancelled) return false
    throw error
  }
}
