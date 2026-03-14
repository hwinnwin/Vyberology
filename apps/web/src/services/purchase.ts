import { isNative } from '@/lib/platform';
import { createCheckoutSession } from './stripe';
import { purchaseProduct, TIER_TO_PRODUCT_ID } from './iap';

export interface PurchaseResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

/**
 * Unified purchase handler.
 * Routes to IAP on native, Stripe on web.
 */
export async function purchaseTier(
  tier: string,
  options: { fullName: string; dob: string; priceId: string }
): Promise<PurchaseResult> {
  if (isNative()) {
    const productId = TIER_TO_PRODUCT_ID[tier];
    if (!productId) return { success: false, error: `Unknown tier: ${tier}` };

    try {
      const purchased = await purchaseProduct(productId);
      return { success: purchased };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Web: Stripe checkout
  try {
    const result = await createCheckoutSession({
      priceId: options.priceId,
      tier,
      fullName: options.fullName,
      dob: options.dob,
    });
    return { success: true, redirectUrl: result.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
