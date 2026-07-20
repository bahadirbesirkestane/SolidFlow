const { AppError } = require("../../shared/app-error");
const { assertCanManageBoard, assertCanManageDepartment } = require("../services/manual-workboard-access-policy");

class UpdateManualWorkboardUseCase {
  constructor({ manualWorkboardRepository, userRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
    this.userRepository = userRepository;
  }

  async execute(boardId, input, actor) {
    const board = await this.manualWorkboardRepository.getBoardById(boardId);
    assertCanManageBoard(board, actor);

    const nextName = String(input.name ?? board.name).trim();
    const nextDepartmentId = String(input.departmentId ?? board.departmentId).trim();
    if (!nextName || !nextDepartmentId) {
      throw new AppError("Pano adi ve departman zorunludur.", {
        code: "MANUAL_BOARD_INVALID_INPUT",
        statusCode: 400,
      });
    }

    assertCanManageDepartment(nextDepartmentId, actor);
    const departments = await this.userRepository.listDepartments();
    const department = departments.find((entry) => entry.id === nextDepartmentId && entry.isActive);
    if (!department) {
      throw new AppError("Gecerli bir departman secilmelidir.", {
        code: "MANUAL_BOARD_INVALID_DEPARTMENT",
        statusCode: 400,
      });
    }

    return this.manualWorkboardRepository.updateBoard(boardId, {
      name: nextName,
      description: String(input.description ?? board.description ?? "").trim(),
      departmentId: nextDepartmentId,
      isActive: input.isActive === undefined ? board.isActive : Boolean(input.isActive),
      isVisibleOnDisplay: input.isVisibleOnDisplay === undefined
        ? board.isVisibleOnDisplay
        : Boolean(input.isVisibleOnDisplay),
      updatedByUserId: actor?.id || "",
    });
  }
}

module.exports = {
  UpdateManualWorkboardUseCase,
};
