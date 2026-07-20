const { AppError } = require("../../shared/app-error");
const { MANUAL_WORKBOARD_MAX_DEPTH } = require("../../domain/constants/manual-workboard-statuses");
const { assertCanManageBoard } = require("../services/manual-workboard-access-policy");

class MoveManualBoardItemUseCase {
  constructor({ manualWorkboardRepository, auditLogRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(itemId, input, actor) {
    const item = await this.manualWorkboardRepository.getItemById(itemId);
    if (!item) {
      throw new AppError("Tasinacak is bulunamadi.", {
        code: "MANUAL_ITEM_NOT_FOUND",
        statusCode: 404,
      });
    }

    const board = await this.manualWorkboardRepository.getBoardById(item.boardId);
    assertCanManageBoard(board, actor);

    const nextParentId = input.parentId ? String(input.parentId).trim() : null;
    const items = board.items || [];
    const parentItem = nextParentId ? items.find((entry) => entry.id === nextParentId) : null;
    if (nextParentId && !parentItem) {
      throw new AppError("Secilen ust is bulunamadi.", {
        code: "MANUAL_ITEM_PARENT_NOT_FOUND",
        statusCode: 404,
      });
    }

    if (nextParentId === item.id) {
      throw new AppError("Bir is kendi altina tasinamaz.", {
        code: "MANUAL_ITEM_INVALID_PARENT",
        statusCode: 400,
      });
    }

    const descendantIds = collectDescendantIds(items, item.id);
    if (nextParentId && descendantIds.has(nextParentId)) {
      throw new AppError("Bir is kendi alt agacina tasinamaz.", {
        code: "MANUAL_ITEM_CYCLE_FORBIDDEN",
        statusCode: 400,
      });
    }

    const nextDepth = parentItem ? parentItem.depth + 1 : 0;
    const itemDescendants = items.filter((entry) => descendantIds.has(entry.id));
    const depthDelta = nextDepth - item.depth;
    const deepestDepth = Math.max(nextDepth, ...itemDescendants.map((entry) => entry.depth + depthDelta));
    if (deepestDepth > MANUAL_WORKBOARD_MAX_DEPTH) {
      throw new AppError("Bu tasima islemi maksimum derinligi asiyor.", {
        code: "MANUAL_ITEM_DEPTH_EXCEEDED",
        statusCode: 400,
      });
    }

    const siblingItems = items
      .filter((entry) => entry.id !== item.id)
      .filter((entry) => (entry.parentId || null) === (nextParentId || null))
      .sort((left, right) => left.orderIndex - right.orderIndex);

    const targetOrderIndex = Number.isInteger(input.targetOrderIndex)
      ? Math.max(0, Math.min(input.targetOrderIndex, siblingItems.length))
      : siblingItems.length;

    const reorderedSiblings = siblingItems.map((entry, index) => {
      const orderIndex = index >= targetOrderIndex ? index + 1 : index;
      return {
        id: entry.id,
        orderIndex,
      };
    });

    const updatedItem = await this.manualWorkboardRepository.moveItem(itemId, {
      parentId: nextParentId,
      orderIndex: targetOrderIndex,
      depth: nextDepth,
      descendantUpdates: itemDescendants.map((entry) => ({
        id: entry.id,
        depth: entry.depth + depthDelta,
      })),
      reorderedSiblings,
      updatedByUserId: actor?.id || "",
    });

    await this.auditLogRepository.log({
      actorUserId: actor?.id || "",
      entityType: "manual_board_item",
      entityId: itemId,
      action: "manual_board_item_moved",
      payload: {
        parentId: nextParentId,
        targetOrderIndex,
      },
    });

    return updatedItem;
  }
}

function collectDescendantIds(items, itemId) {
  const result = new Set();
  const queue = [itemId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    for (const item of items) {
      if ((item.parentId || null) !== currentId) {
        continue;
      }

      result.add(item.id);
      queue.push(item.id);
    }
  }

  return result;
}

module.exports = {
  MoveManualBoardItemUseCase,
};
