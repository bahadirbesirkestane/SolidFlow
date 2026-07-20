import type { ReactNode } from "react";
import { Paper, Stack, Text } from "@mantine/core";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "accent" | "success" | "warning";
};

export function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <Paper className={`stat-card stat-card--${tone}`} withBorder radius="lg" p="md">
      <Stack gap={4}>
        <Text className="stat-card__label" size="xs" fw={700} tt="uppercase" c="dimmed">{label}</Text>
        <Text className="stat-card__value" fw={800} size="xl">{value}</Text>
        {hint ? <Text className="stat-card__hint" size="xs" c="dimmed">{hint}</Text> : null}
      </Stack>
    </Paper>
  );
}
