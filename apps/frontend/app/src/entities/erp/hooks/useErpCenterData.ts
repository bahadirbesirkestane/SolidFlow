import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getErpWorkOrderDetail,
  listErpWorkOrders,
  startErpWorkOrder,
} from "@/entities/erp/api/erp-api";

export function useErpCenterData() {
  const queryClient = useQueryClient();
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);

  const workOrdersQuery = useQuery({
    queryKey: ["erp", "workOrders"],
    queryFn: listErpWorkOrders,
  });

  useEffect(() => {
    if (!selectedWorkOrderId && workOrdersQuery.data?.[0]?.id) {
      setSelectedWorkOrderId(workOrdersQuery.data[0].id);
    }
  }, [selectedWorkOrderId, workOrdersQuery.data]);

  const detailQuery = useQuery({
    queryKey: ["erp", "workOrder", selectedWorkOrderId],
    queryFn: () => getErpWorkOrderDetail(selectedWorkOrderId as string),
    enabled: Boolean(selectedWorkOrderId),
  });

  const startMutation = useMutation({
    mutationFn: (workOrderId: string) => startErpWorkOrder(workOrderId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["erp"] }),
        queryClient.invalidateQueries({ queryKey: ["operations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });

  async function refresh() {
    await Promise.all([workOrdersQuery.refetch(), detailQuery.refetch()]);
  }

  return {
    selectedWorkOrderId,
    setSelectedWorkOrderId,
    workOrdersQuery,
    detailQuery,
    startMutation,
    refresh,
  };
}
