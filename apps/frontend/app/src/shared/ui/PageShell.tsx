import type { PropsWithChildren, ReactNode } from "react";
import { Group, Stack, Text, Title } from "@mantine/core";

type PageShellProps = PropsWithChildren<{
  title: string;
  description: string;
  actions?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
}>;

export function PageShell({ title, description, actions, eyebrow = "workspace", meta, children }: PageShellProps) {
  return (
    <Stack className="page-shell" gap="xl">
      <Group className="page-shell__hero" justify="space-between" align="flex-start" wrap="wrap">
        <Stack className="page-shell__hero-copy" gap={6}>
          <Text className="page-shell__eyebrow" size="xs" fw={800} tt="uppercase">
            {eyebrow}
          </Text>
          <Title className="page-shell__title" order={1}>
            {title}
          </Title>
          <Text className="page-shell__description" c="dimmed">
            {description}
          </Text>
          {meta ? <Group className="page-shell__meta" gap="xs">{meta}</Group> : null}
        </Stack>
        {actions ? <Group className="page-shell__hero-actions" gap="sm">{actions}</Group> : null}
      </Group>
      <Stack className="page-shell__body" gap="lg">{children}</Stack>
    </Stack>
  );
}
