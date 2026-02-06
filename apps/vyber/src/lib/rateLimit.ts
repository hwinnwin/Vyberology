interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export function createRateLimiter({ max, windowMs }: RateLimitOptions) {
  const timestamps: number[] = [];

  return () => {
    const now = Date.now();
    while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= max) {
      return false;
    }
    timestamps.push(now);
    return true;
  };
}
