class ListErpWorkOrdersUseCase {
  constructor({ erpWorkOrderRepository }) {
    this.erpWorkOrderRepository = erpWorkOrderRepository;
  }

  async execute() {
    const workOrders = await this.erpWorkOrderRepository.list();

    return workOrders.map((workOrder) => ({
      id: workOrder.id,
      erpNo: workOrder.erpNo,
      projectCode: workOrder.projectCode,
      customerName: workOrder.customerName,
      status: workOrder.status,
      dueDate: workOrder.dueDate,
      lineCount: Array.isArray(workOrder.lines) ? workOrder.lines.length : 0,
      totalQuantity: Array.isArray(workOrder.lines)
        ? workOrder.lines.reduce((total, line) => total + Number(line.quantity || 0), 0)
        : 0,
      sourceType: workOrder.sourceType || "mock",
    }));
  }
}

module.exports = {
  ListErpWorkOrdersUseCase,
};
