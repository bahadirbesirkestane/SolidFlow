const { assertCanManageBoard } = require("../services/manual-workboard-access-policy");

class DeleteManualWorkboardUseCase {
  constructor({ manualWorkboardRepository, auditLogRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(boardId, actor) {
    const board = await this.manualWorkboardRepository.getBoardById(boardId);
    assertCanManageBoard(board, actor);

    await this.manualWorkboardRepository.deleteBoard(boardId);
    await this.auditLogRepository.log({
      actorUserId: actor?.id || "",
      entityType: "manual_board",
      entityId: boardId,
      action: "manual_board_deleted",
      payload: {
        departmentId: board.departmentId,
        name: board.name,
      },
    });

    return { id: boardId, deleted: true };
  }
}

module.exports = {
  DeleteManualWorkboardUseCase,
};
