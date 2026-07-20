const { AUTH_ROLES } = require("../../domain/constants/auth-roles");
const { AppError } = require("../../shared/app-error");

function filterAccessibleBoards(boards, actor) {
  const normalizedBoards = Array.isArray(boards) ? boards : [];
  if (!actor) {
    return [];
  }

  if (actor.role === AUTH_ROLES.ADMIN) {
    return normalizedBoards;
  }

  return normalizedBoards.filter((board) => board.departmentId === actor.departmentId);
}

function assertCanViewBoard(board, actor) {
  if (!board) {
    throw new AppError("Manuel is panosu bulunamadi.", {
      code: "MANUAL_BOARD_NOT_FOUND",
      statusCode: 404,
    });
  }

  if (actor?.role === AUTH_ROLES.ADMIN) {
    return;
  }

  if (board.departmentId !== actor?.departmentId) {
    throw new AppError("Bu pano icin yetkiniz bulunmuyor.", {
      code: "MANUAL_BOARD_FORBIDDEN",
      statusCode: 403,
    });
  }
}

function assertCanManageBoard(board, actor) {
  assertCanViewBoard(board, actor);
  if (actor?.role === AUTH_ROLES.WORKER) {
    throw new AppError("Bu pano icin duzenleme yetkiniz bulunmuyor.", {
      code: "MANUAL_BOARD_READ_ONLY",
      statusCode: 403,
    });
  }
}

function assertCanManageDepartment(departmentId, actor) {
  if (actor?.role === AUTH_ROLES.ADMIN) {
    return;
  }

  if (actor?.role !== AUTH_ROLES.MANAGER || departmentId !== actor.departmentId) {
    throw new AppError("Bu departman icin pano yonetemezsiniz.", {
      code: "MANUAL_BOARD_DEPARTMENT_FORBIDDEN",
      statusCode: 403,
    });
  }
}

module.exports = {
  filterAccessibleBoards,
  assertCanViewBoard,
  assertCanManageBoard,
  assertCanManageDepartment,
};
