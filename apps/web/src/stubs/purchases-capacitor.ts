// Web stub for @revenuecat/purchases-capacitor
// This module is native-only; on web it should never be called.
// The stub exists so Vite can resolve the import without error.

export const Purchases = {
  configure: () => Promise.resolve(),
  logIn: () => Promise.resolve({ customerInfo: {} }),
  getProducts: () => Promise.resolve({ products: [] }),
  purchaseStoreProduct: () => Promise.reject(new Error('IAP not available on web')),
  restorePurchases: () => Promise.resolve({ customerInfo: {} }),
  getCustomerInfo: () => Promise.resolve({ customerInfo: {} }),
};

export const LOG_LEVEL = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
