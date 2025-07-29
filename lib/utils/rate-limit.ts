interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private tokens: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(identifier: string, limit: number): Promise<RateLimitResult> {
    const now = Date.now();
    const resetTime = now + this.config.interval;

    const existing = this.tokens.get(identifier);

    if (!existing || now > existing.resetTime) {
      // First request or reset time passed
      this.tokens.set(identifier, { count: 1, resetTime });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: resetTime,
      };
    }

    if (existing.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: existing.resetTime,
      };
    }

    // Increment count
    existing.count++;
    this.tokens.set(identifier, existing);

    return {
      success: true,
      limit,
      remaining: limit - existing.count,
      reset: existing.resetTime,
    };
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.tokens.entries()) {
      if (now > value.resetTime) {
        this.tokens.delete(key);
      }
    }
  }
}

export function rateLimit(config: RateLimitConfig): RateLimiter {
  const limiter = new RateLimiter(config);

  // Clean up expired entries every minute
  setInterval(() => {
    limiter.cleanup();
  }, 60000);

  return limiter;
}
