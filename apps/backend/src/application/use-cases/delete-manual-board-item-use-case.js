const { AppError } = require("../../shared/app-error");
const { assertCanManageBoard } = require("../services/manual-workboard-access-policy");

class DeleteManualBoardItemUseCase {
  constructor({ manualWorkboardRepository, auditLogRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(itemId, actor) {
    const item = await this.manualWorkboardRepository.getItemById(itemId);
    if (!item) {
      throw new AppError("Silinecek is bulunamadi.", {
        code: "MANUAL_ITEM_NOT_FOUND",
        statusCode: 404,
      });
    }

    const board = await this.manualWorkboardRepository.getBoardById(item.boardId);
    assertCanManageBoard(board, actor);

    const descendants = collectDescendantIds(board.items || [], item.id);
    const deleteIds = [item.id, ...descendants];
    await this.manualWorkboardRepository.deleteItemTree(deleteIds, board.id, actor?.id || "");

    await this.auditLogRepository.log({
      actorUserId: actor?.id || "",
      entityType: "manual_board_item",
      entityId: itemId,
      action: "manual_board_item_deleted",
      payload: {
        deletedItemCount: deleteIds.length,
      },
    });

    return {
      id: itemId,
      deleted: true,
      deletedItemCount: deleteIds.length,
    };
  }
}

function collectDescendantIds(items, itemId) {
  const result = [];
  const queue = [itemId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    for (const item of items) {
      if ((item.parentId || null) !== currentId) {
        continue;
      }

      result.push(item.id);
      queue.push(item.id);
    }
  }

  return result;
}

module.exports = {
  DeleteManualBoardItemUseCase,
};
