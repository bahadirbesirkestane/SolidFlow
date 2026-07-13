const { AppError } = require("../../shared/app-error");

class LoginUseCase {
  constructor({ userRepository, authSessionRepository, passwordHasher, loginAttemptLimiter, auditLogRepository }) {
    this.userRepository = userRepository;
    this.authSessionRepository = authSessionRepository;
    this.passwordHasher = passwordHasher;
    this.loginAttemptLimiter = loginAttemptLimiter;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(input, context = {}) {
    const login = String(input?.login || "").trim().toLowerCase();
    const password = String(input?.password || "");
    const identityKey = `${context.ipAddress || "unknown"}:${login}`;

    if (!login || !password) {
      throw new AppError("Kullanici adi ve sifre zorunludur.", {
        code: "AUTH_INVALID_INPUT",
        statusCode: 400,
      });
    }

    try {
      this.loginAttemptLimiter.ensureAllowed(identityKey);
    } catch (error) {
      throw new AppError(error.message, {
        code: "AUTH_RATE_LIMITED",
        statusCode: 429,
        details: {
          retryAfterSeconds: error.retryAfterSeconds || null,
        },
      });
    }

    const user = await this.userRepository.findUserForAuth(login);
    if (!user || !user.passwordHash || !this.passwordHasher.verifyPassword(password, user.passwordHash)) {
      this.loginAttemptLimiter.recordFailure(identityKey);
      await this.auditLogRepository.log({
        entityType: "auth",
        entityId: login || "unknown",
        action: "login_failed",
        payload: {
          login,
          ipAddress: context.ipAddress || "",
        },
      });
      throw new AppError("Kullanici adi veya sifre hatali.", {
        code: "AUTH_INVALID_CREDENTIALS",
        statusCode: 401,
      });
    }

    if (!user.isActive) {
      this.loginAttemptLimiter.recordFailure(identityKey);
      throw new AppError("Bu kullanici pasif durumda.", {
        code: "AUTH_USER_INACTIVE",
        statusCode: 403,
      });
    }

    this.loginAttemptLimiter.clear(identityKey);
    await this.userRepository.updateLastLoginAt(user.id);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const session = await this.authSessionRepository.createSession({
      userId: user.id,
      ipAddress: context.ipAddress || "",
      userAgent: context.userAgent || "",
      expiresAt,
    });

    await this.auditLogRepository.log({
      entityType: "auth",
      entityId: user.id,
      action: "login_succeeded",
      actorUserId: user.id,
      payload: {
        role: user.role,
        ipAddress: context.ipAddress || "",
      },
    });

    return {
      session,
      user: await this.userRepository.getUserById(user.id),
    };
  }
}

module.exports = {
  LoginUseCase,
};
