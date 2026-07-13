const { AppError } = require("../../shared/app-error");

class AdjustUserScoreUseCase {
  constructor({ userRepository, auditLogRepository }) {
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(userId, input, actorUser) {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new AppError("Kullanici bulunamadi.", {
        code: "USER_NOT_FOUND",
        statusCode: 404,
      });
    }

    const delta = Number(input?.delta);
    const reason = String(input?.reason || "").trim();
    if (!Number.isFinite(delta) || delta === 0) {
      throw new AppError("Puan duzeltmesi sifir disinda bir sayi olmali.", {
        code: "INVALID_SCORE_ADJUSTMENT",
        statusCode: 400,
      });
    }

    if (!reason) {
      throw new AppError("Puan duzeltmesi icin aciklama gerekli.", {
        code: "INVALID_SCORE_ADJUSTMENT",
        statusCode: 400,
      });
    }

    const normalizedDelta = Math.max(-25, Math.min(25, Math.round(delta)));
    await this.auditLogRepository.log({
      actorUserId: actorUser?.id || "",
      entityType: "user_score",
      entityId: userId,
      action: "score_adjusted",
      payload: {
        delta: normalizedDelta,
        reason,
      },
    });

    return {
      success: true,
      userId,
      delta: normalizedDelta,
      reason,
    };
  }
}

module.exports = {
  AdjustUserScoreUseCase,
};
