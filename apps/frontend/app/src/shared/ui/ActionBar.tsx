import type { PropsWithChildren, ReactNode } from "react";
import { Group, Paper, Stack, Text } from "@mantine/core";

type ActionBarProps = PropsWithChildren<{
  title?: string;
  description?: string;
  actions?: ReactNode;
}>;

export function ActionBar({ title, description, actions, children }: ActionBarProps) {
  return (
    <Paper className="action-bar" withBorder radius="lg" p="md">
      {(title || description) ? (
        <Stack className="action-bar__copy" gap={2}>
          {title ? <Text fw={700}>{title}</Text> : null}
          {description ? <Text c="dimmed" size="sm">{description}</Text> : null}
        </Stack>
      ) : null}
      {children ? <Group className="action-bar__content" gap="sm">{children}</Group> : null}
      {actions ? <Group className="action-bar__actions" gap="xs">{actions}</Group> : null}
    </Paper>
  );
}
