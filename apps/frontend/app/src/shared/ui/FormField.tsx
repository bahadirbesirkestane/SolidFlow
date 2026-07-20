import type { PropsWithChildren, ReactNode } from "react";
import { Group, Input, Stack } from "@mantine/core";

type FormFieldProps = PropsWithChildren<{
  label: string;
  hint?: string;
  actions?: ReactNode;
}>;

export function FormField({ label, hint, actions, children }: FormFieldProps) {
  return (
    <Input.Wrapper className="form-field" label={label} description={hint}>
      <Stack gap={6}>
        {children}
        {actions ? <Group className="form-field__actions" gap="xs">{actions}</Group> : null}
      </Stack>
    </Input.Wrapper>
  );
}
