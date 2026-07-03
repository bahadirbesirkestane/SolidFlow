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
}

module.exports = {
  LocalErpWorkOrderRepository,
};
