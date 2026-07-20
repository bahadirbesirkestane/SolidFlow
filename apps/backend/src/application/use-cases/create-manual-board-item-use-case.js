const { AppError } = require("../../shared/app-error");
const {
  ALL_MANUAL_WORKBOARD_STATUSES,
  MANUAL_WORKBOARD_MAX_DEPTH,
  resolveManualWorkboardProgress,
} = require("../../domain/constants/manual-workboard-statuses");
const { assertCanManageBoard } = require("../services/manual-workboard-access-policy");

class CreateManualBoardItemUseCase {
  constructor({ manualWorkboardRepository, userRepository, auditLogRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(boardId, input, actor) {
    const board = await this.manualWorkboardRepository.getBoardById(boardId);
    assertCanManageBoard(board, actor);

    const title = String(input.title || "").trim();
    if (!title) {
      throw new AppError("Is basligi zorunludur.", {
        code: "MANUAL_ITEM_INVALID_TITLE",
        statusCode: 400,
      });
    }

    const items = board.items || [];
    const parentId = input.parentId ? String(input.parentId).trim() : null;
    const parentItem = parentId ? items.find((entry) => entry.id === parentId) : null;
    if (parentId && !parentItem) {
      throw new AppError("Secilen ust is bulunamadi.", {
        code: "MANUAL_ITEM_PARENT_NOT_FOUND",
        statusCode: 404,
      });
    }

    const depth = parentItem ? parentItem.depth + 1 : 0;
    if (depth > MANUAL_WORKBOARD_MAX_DEPTH) {
      throw new AppError("Maksimum alt is derinligi asildi.", {
        code: "MANUAL_ITEM_DEPTH_EXCEEDED",
        statusCode: 400,
      });
    }

    const status = normalizeStatus(input.status);
    const assigneeIds = normalizeAssigneeIds(input.assigneeIds);
    await assertAssigneesExist(this.userRepository, assigneeIds);

    const siblingItems = items
      .filter((entry) => (entry.parentId || null) === (parentId || null))
      .sort((left, right) => left.orderIndex - right.orderIndex);

    const createdItem = await this.manualWorkboardRepository.createItem({
      boardId,
      parentId,
      title,
      content: String(input.content || "").trim(),
      status,
      progressPercent: resolveManualWorkboardProgress(status),
      orderIndex: siblingItems.length,
      depth,
      isArchived: false,
      assigneeIds,
      createdByUserId: actor?.id || "",
      updatedByUserId: actor?.id || "",
    });

    await this.auditLogRepository.log({
      actorUserId: actor?.id || "",
      entityType: "manual_board_item",
      entityId: createdItem.id,
      action: "manual_board_item_created",
      payload: {
        boardId,
        parentId,
        status,
      },
    });

    return createdItem;
  }
}

function normalizeStatus(status) {
  const normalized = String(status || "").trim();
  if (!ALL_MANUAL_WORKBOARD_STATUSES.includes(normalized)) {
    throw new AppError("Gecersiz is durumu secildi.", {
      code: "MANUAL_ITEM_INVALID_STATUS",
      statusCode: 400,
    });
  }

  return normalized;
}

function normalizeAssigneeIds(value) {
  return Array.isArray(value)
    ? [...new Set(value.map((entry) => String(entry || "").trim()).filter(Boolean))]
    : [];
}

async function assertAssigneesExist(userRepository, assigneeIds) {
  if (assigneeIds.length === 0) {
    return;
  }

  const users = await userRepository.listUsers();
  const activeUserIds = new Set(users.filter((entry) => entry.isActive).map((entry) => entry.id));
  const invalidUserId = assigneeIds.find((entry) => !activeUserIds.has(entry));
  if (invalidUserId) {
    throw new AppError("Atanan kullanicilardan biri aktif degil veya bulunamadi.", {
      code: "MANUAL_ITEM_INVALID_ASSIGNEE",
      statusCode: 400,
      details: {
        userId: invalidUserId,
      },
    });
  }
}

module.exports = {
  CreateManualBoardItemUseCase,
};
