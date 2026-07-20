const { AppError } = require("../../shared/app-error");
const { ALL_MANUAL_WORKBOARD_STATUSES, resolveManualWorkboardProgress } = require("../../domain/constants/manual-workboard-statuses");
const { assertCanManageBoard } = require("../services/manual-workboard-access-policy");

class UpdateManualBoardItemUseCase {
  constructor({ manualWorkboardRepository, userRepository, auditLogRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
    this.userRepository = userRepository;
    this.auditLogRepository = auditLogRepository;
  }

  async execute(itemId, input, actor) {
    const item = await this.manualWorkboardRepository.getItemById(itemId);
    if (!item) {
      throw new AppError("Guncellenecek is bulunamadi.", {
        code: "MANUAL_ITEM_NOT_FOUND",
        statusCode: 404,
      });
    }

    const board = await this.manualWorkboardRepository.getBoardById(item.boardId);
    assertCanManageBoard(board, actor);

    const title = String(input.title ?? item.title).trim();
    if (!title) {
      throw new AppError("Is basligi zorunludur.", {
        code: "MANUAL_ITEM_INVALID_TITLE",
        statusCode: 400,
      });
    }

    const status = normalizeStatus(input.status ?? item.status);
    const assigneeIds = normalizeAssigneeIds(input.assigneeIds ?? item.assigneeIds);
    await assertAssigneesExist(this.userRepository, assigneeIds);

    const updatedItem = await this.manualWorkboardRepository.updateItem(itemId, {
      title,
      content: String(input.content ?? item.content ?? "").trim(),
      status,
      progressPercent: resolveManualWorkboardProgress(status),
      isArchived: input.isArchived === undefined ? item.isArchived : Boolean(input.isArchived),
      assigneeIds,
      updatedByUserId: actor?.id || "",
    });

    await this.auditLogRepository.log({
      actorUserId: actor?.id || "",
      entityType: "manual_board_item",
      entityId: itemId,
      action: "manual_board_item_updated",
      payload: {
        status,
        assigneeIds,
      },
    });

    return updatedItem;
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
  UpdateManualBoardItemUseCase,
};
