class DeactivateUserUseCase {
  constructor({ userRepository, auditLogRepository }) {
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(userId, actor = null) {
    await this.userRepository.deactivateUser(userId);
    await this.auditLogRepository.log({
      entityType: "user",
      entityId: userId,
      actorUserId: actor?.id || "",
      action: "user_deactivated",
      payload: {},
    });
    return { success: true };
  }
}

module.exports = {
  DeactivateUserUseCase,
};
