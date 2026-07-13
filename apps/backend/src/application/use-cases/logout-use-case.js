class LogoutUseCase {
  constructor({ authSessionRepository, auditLogRepository }) {
    this.authSessionRepository = authSessionRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(sessionToken, auth) {
    if (!sessionToken) {
      return { success: true };
    }

    await this.authSessionRepository.revokeSession(sessionToken);

    if (auth?.user?.id) {
      await this.auditLogRepository.log({
        entityType: "auth",
        entityId: auth.user.id,
        actorUserId: auth.user.id,
        action: "logout",
        payload: {},
      });
    }

    return { success: true };
  }
}

module.exports = {
  LogoutUseCase,
};
