import type { PropsWithChildren, ReactNode } from "react";
import { Card, Group, Stack, Text, Title } from "@mantine/core";

type SectionCardProps = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function SectionCard({ title, description, actions, children }: SectionCardProps) {
  return (
    <Card className="section-card">
      <Group className="section-card__header" justify="space-between" align="flex-start" wrap="wrap">
        <Stack className="section-card__copy" gap={4}>
          <Title order={2}>{title}</Title>
          {description ? <Text c="dimmed">{description}</Text> : null}
        </Stack>
        {actions ? <Group className="section-card__actions" gap="xs">{actions}</Group> : null}
      </Group>
      <Stack className="section-card__body" gap="md">{children}</Stack>
    </Card>
  );
}
