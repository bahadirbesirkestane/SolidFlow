class LoginAttemptLimiter {
  constructor({ maxAttempts = 5, windowMs = 10 * 60 * 1000, lockMs = 10 * 60 * 1000 } = {}) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.lockMs = lockMs;
    this.attempts = new Map();
  }

  ensureAllowed(identityKey) {
    const record = this.attempts.get(identityKey);
    if (!record) {
      return;
    }

    const now = Date.now();
    if (record.lockedUntil && record.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      const error = new Error("Cok fazla hatali giris denemesi yapildi. Lutfen daha sonra tekrar deneyin.");
      error.retryAfterSeconds = retryAfterSeconds;
      throw error;
    }

    if (record.windowStartedAt + this.windowMs <= now) {
      this.attempts.delete(identityKey);
    }
  }

  recordFailure(identityKey) {
    const now = Date.now();
    const current = this.attempts.get(identityKey);
    if (!current || current.windowStartedAt + this.windowMs <= now) {
      this.attempts.set(identityKey, {
        count: 1,
        windowStartedAt: now,
        lockedUntil: null,
      });
      return;
    }

    current.count += 1;
    if (current.count >= this.maxAttempts) {
      current.lockedUntil = now + this.lockMs;
    }
    this.attempts.set(identityKey, current);
  }

  clear(identityKey) {
    this.attempts.delete(identityKey);
  }
}

module.exports = {
  LoginAttemptLimiter,
};
