import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adjustUserScore,
  createUser,
  deactivateUser,
  getUserProfile,
  listUsers,
  updateUser,
} from "@/entities/operations/api/operations-api";

export function useUserManagementData() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ["userManagement", "users"],
    queryFn: listUsers,
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    username: "",
    departmentId: "",
    role: "worker" as "admin" | "manager" | "worker",
    password: "",
  });
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    username: "",
    departmentId: "",
    role: "worker" as "admin" | "manager" | "worker",
    password: "",
    isActive: true,
  });
  const [scoreAdjustmentForm, setScoreAdjustmentForm] = useState({
    delta: "3",
    reason: "",
  });

  const selectedUser = useMemo(
    () => usersQuery.data?.users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, usersQuery.data?.users],
  );

  useEffect(() => {
    if (!selectedUserId && usersQuery.data?.users?.[0]?.id) {
      setSelectedUserId(usersQuery.data.users[0].id);
    }
  }, [selectedUserId, usersQuery.data?.users]);

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setEditForm({
      fullName: selectedUser.fullName,
      email: selectedUser.email || "",
      username: selectedUser.username || "",
      departmentId: selectedUser.departmentId,
      role: selectedUser.role || "worker",
      password: "",
      isActive: selectedUser.isActive,
    });
  }, [selectedUser]);

  const userProfileQuery = useQuery({
    queryKey: ["userManagement", "profile", selectedUserId],
    queryFn: () => getUserProfile(selectedUserId),
    enabled: Boolean(selectedUserId),
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (createdUser) => {
      setSelectedUserId(createdUser.id);
      setCreateForm({
        fullName: "",
        email: "",
        username: "",
        departmentId: "",
        role: "worker",
        password: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userManagement", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["operations", "users"] }),
      ]);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: Parameters<typeof updateUser>[1] }) =>
      updateUser(userId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userManagement", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["userManagement", "profile", selectedUserId] }),
        queryClient.invalidateQueries({ queryKey: ["operations", "users"] }),
      ]);
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userManagement", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["userManagement", "profile", selectedUserId] }),
        queryClient.invalidateQueries({ queryKey: ["operations", "users"] }),
      ]);
    },
  });

  const adjustScoreMutation = useMutation({
    mutationFn: ({ userId, delta, reason }: { userId: string; delta: number; reason: string }) =>
      adjustUserScore(userId, { delta, reason }),
    onSuccess: async () => {
      setScoreAdjustmentForm({
        delta: "3",
        reason: "",
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["userManagement", "profile", selectedUserId] }),
      ]);
    },
  });

  const usersByDepartment = useMemo(() => {
    const departments = usersQuery.data?.departments || [];
    const users = usersQuery.data?.users || [];
    return departments.map((department) => ({
      id: department.id,
      name: department.name,
      users: users.filter((user) => user.departmentId === department.id),
    })).filter((department) => department.users.length > 0);
  }, [usersQuery.data]);

  return {
    usersQuery,
    usersByDepartment,
    selectedUserId,
    setSelectedUserId,
    selectedUser,
    userProfileQuery,
    createForm,
    setCreateForm,
    editForm,
    setEditForm,
    scoreAdjustmentForm,
    setScoreAdjustmentForm,
    createUserMutation,
    updateUserMutation,
    deactivateUserMutation,
    adjustScoreMutation,
  };
}
