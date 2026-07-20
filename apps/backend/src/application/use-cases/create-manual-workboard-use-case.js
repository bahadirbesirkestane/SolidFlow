const { AppError } = require("../../shared/app-error");
const { assertCanManageDepartment } = require("../services/manual-workboard-access-policy");

class CreateManualWorkboardUseCase {
  constructor({ manualWorkboardRepository, userRepository }) {
    this.manualWorkboardRepository = manualWorkboardRepository;
    this.userRepository = userRepository;
  }

  async execute(input, actor) {
    const name = String(input.name || "").trim();
    const departmentId = String(input.departmentId || "").trim();

    if (!name || !departmentId) {
      throw new AppError("Pano adi ve departman zorunludur.", {
        code: "MANUAL_BOARD_INVALID_INPUT",
        statusCode: 400,
      });
    }

    assertCanManageDepartment(departmentId, actor);
    await assertDepartmentExists(this.userRepository, departmentId);

    return this.manualWorkboardRepository.createBoard({
      name,
      description: String(input.description || "").trim(),
      departmentId,
      isActive: input.isActive !== false,
      isVisibleOnDisplay: input.isVisibleOnDisplay !== false,
      createdByUserId: actor?.id || "",
      updatedByUserId: actor?.id || "",
    });
  }
}

async function assertDepartmentExists(userRepository, departmentId) {
  const departments = await userRepository.listDepartments();
  const department = departments.find((entry) => entry.id === departmentId && entry.isActive);
  if (!department) {
    throw new AppError("Gecerli bir departman secilmelidir.", {
      code: "MANUAL_BOARD_INVALID_DEPARTMENT",
      statusCode: 400,
    });
  }
}

module.exports = {
  CreateManualWorkboardUseCase,
};
