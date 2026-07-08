class LocalErpWorkOrderRepository {
  constructor({ jsonRepository }) {
    this.jsonRepository = jsonRepository;
  }

  async list() {
    const payload = await this.jsonRepository.read();
    return Array.isArray(payload.workOrders) ? payload.workOrders : [];
  }

  async getById(workOrderId) {
    const workOrders = await this.list();
    return workOrders.find((workOrder) => workOrder.id === workOrderId) || null;
  }

  async update(workOrderId, updater) {
    const payload = await this.jsonRepository.read();
    const workOrders = Array.isArray(payload.workOrders) ? payload.workOrders : [];
    const targetIndex = workOrders.findIndex((workOrder) => workOrder.id === workOrderId);

    if (targetIndex === -1) {
      return null;
    }

    const currentWorkOrder = workOrders[targetIndex];
    const nextWorkOrder = typeof updater === "function"
      ? updater(currentWorkOrder)
      : { ...currentWorkOrder, ...(updater || {}) };

    workOrders[targetIndex] = nextWorkOrder;
    await this.jsonRepository.write({
      ...payload,
      workOrders,
    });

    return nextWorkOrder;
  }
}

module.exports = {
  LocalErpWorkOrderRepository,
};
