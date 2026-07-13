import type { PropsWithChildren, ReactNode } from "react";

type FormFieldProps = PropsWithChildren<{
  label: string;
  hint?: string;
  actions?: ReactNode;
}>;

export function FormField({ label, hint, actions, children }: FormFieldProps) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      {children}
      {hint ? <span className="form-field__hint">{hint}</span> : null}
      {actions ? <span className="form-field__actions">{actions}</span> : null}
    </label>
  );
}
