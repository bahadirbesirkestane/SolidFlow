const { AppError } = require("../../shared/app-error");
const { assertCanManageBoard } = require("../services/manual-workboard-access-policy");

class ReorderManualBoardItemUseCase {
  constructor({ manualWorkboardRepository, auditLogRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(itemId, input, actor) {
    const direction = String(input.direction || "").trim().toLowerCase();
    if (!["up", "down"].includes(direction)) {
      throw new AppError("Gecersiz tasima yonu secildi.", {
        code: "MANUAL_ITEM_INVALID_DIRECTION",
        statusCode: 400,
      });
    }

    const item = await this.manualWorkboardRepository.getItemById(itemId);
    if (!item) {
      throw new AppError("Sirasi degistirilecek is bulunamadi.", {
        code: "MANUAL_ITEM_NOT_FOUND",
        statusCode: 404,
      });
    }

    const board = await this.manualWorkboardRepository.getBoardById(item.boardId);
    assertCanManageBoard(board, actor);

    const siblings = (board.items || [])
      .filter((entry) => (entry.parentId || null) === (item.parentId || null))
      .sort((left, right) => left.orderIndex - right.orderIndex);
    const currentIndex = siblings.findIndex((entry) => entry.id === itemId);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex === -1 || swapIndex < 0 || swapIndex >= siblings.length) {
      return item;
    }

    const reordered = [...siblings];
    const [currentItem] = reordered.splice(currentIndex, 1);
    reordered.splice(swapIndex, 0, currentItem);

    await this.manualWorkboardRepository.reorderItems(
      board.id,
      reordered.map((entry, index) => ({
        id: entry.id,
        orderIndex: index,
      })),
      actor?.id || "",
    );

    await this.auditLogRepository.log({
      actorUserId: actor?.id || "",
      entityType: "manual_board_item",
      entityId: itemId,
      action: "manual_board_item_reordered",
      payload: {
        direction,
      },
    });

    return this.manualWorkboardRepository.getItemById(itemId);
  }
}

module.exports = {
  ReorderManualBoardItemUseCase,
};
