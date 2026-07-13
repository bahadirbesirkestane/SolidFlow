const { AppError } = require("../../shared/app-error");
const {
  buildDepartmentBenchmark,
  calculatePerformanceProfile,
} = require("../services/performance-scoring");

class GetUserProfileUseCase {
  constructor({ userRepository, workflowInstanceRepository, auditLogRepository, assignmentRuleRepository }) {
    this.userRepository = userRepository;
    this.workflowInstanceRepository = workflowInstanceRepository;
    this.auditLogRepository = auditLogRepository;
    this.assignmentRuleRepository = assignmentRuleRepository;
  }

  async execute(userId) {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new AppError("Kullanici bulunamadi.", {
        code: "USER_NOT_FOUND",
        statusCode: 404,
      });
    }

    const summary = await this.workflowInstanceRepository.getUserWorkSummary(userId);
    const assignmentConfig = await this.assignmentRuleRepository.getConfig();
    const workflowSlaRules = assignmentConfig.workflowSlaRules || [];
    const manualAdjustments = await this.auditLogRepository.listByEntity("user_score", userId);
    const performance = calculatePerformanceProfile({
      activeAssignments: summary.activeAssignments,
      completedAssignments: summary.completedAssignments,
      slaRules: workflowSlaRules,
      manualAdjustments: manualAdjustments.map((item) => ({
        id: item.id,
        delta: Number(item.payload?.delta || 0),
        reason: String(item.payload?.reason || ""),
        createdAt: item.createdAt,
        createdByUserId: item.actorUserId || "",
      })),
    });
    const departmentUsers = (await this.userRepository.listUsers())
      .filter((candidate) => candidate.departmentId === user.departmentId);
    const departmentEntries = [];

    for (const departmentUser of departmentUsers) {
      const departmentSummary = await this.workflowInstanceRepository.getUserWorkSummary(departmentUser.id);
      const departmentAdjustments = await this.auditLogRepository.listByEntity("user_score", departmentUser.id);
      const departmentPerformance = calculatePerformanceProfile({
        activeAssignments: departmentSummary.activeAssignments,
        completedAssignments: departmentSummary.completedAssignments,
        slaRules: workflowSlaRules,
        manualAdjustments: departmentAdjustments.map((item) => ({
          delta: Number(item.payload?.delta || 0),
        })),
      });
      departmentEntries.push({
        userId: departmentUser.id,
        score: departmentPerformance.score.total,
        averageCompletionHours: departmentPerformance.metrics.averageCompletionHours,
      });
    }

    return {
      user,
      summary: {
        ...summary,
        performance,
        departmentBenchmark: buildDepartmentBenchmark({
          selectedUserId: user.id,
          selectedDepartmentName: user.departmentName,
          entries: departmentEntries,
          selectedScore: performance.score.total,
        }),
        manualAdjustments: manualAdjustments.map((item) => ({
          id: item.id,
          delta: Number(item.payload?.delta || 0),
          reason: String(item.payload?.reason || ""),
          createdAt: item.createdAt,
          createdByUserId: item.actorUserId || "",
        })),
      },
    };
  }
}

module.exports = {
  GetUserProfileUseCase,
};
