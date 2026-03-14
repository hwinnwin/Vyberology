import { vi } from 'vitest';

export const Purchases = {
  configure: vi.fn(),
  logIn: vi.fn(),
  getProducts: vi.fn(() => Promise.resolve({ products: [] })),
  purchaseStoreProduct: vi.fn(),
};
