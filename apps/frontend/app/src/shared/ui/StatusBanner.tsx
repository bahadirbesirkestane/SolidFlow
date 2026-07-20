import { Alert } from "@mantine/core";
import { IconAlertTriangle, IconCircleCheck, IconInfoCircle, IconX } from "@tabler/icons-react";

type StatusBannerProps = {
  tone?: "neutral" | "success" | "danger" | "warning" | "info";
  children: string;
};

export function StatusBanner({ tone = "neutral", children }: StatusBannerProps) {
  return (
    <Alert
      className={`status-banner status-banner--${tone}`}
      color={resolveColor(tone)}
      icon={resolveIcon(tone)}
      radius="lg"
      variant="light"
    >
      {children}
    </Alert>
  );
}

function resolveColor(tone: NonNullable<StatusBannerProps["tone"]>) {
  if (tone === "success") {
    return "green";
  }

  if (tone === "danger") {
    return "red";
  }

  if (tone === "warning") {
    return "yellow";
  }

  return "blue";
}

function resolveIcon(tone: NonNullable<StatusBannerProps["tone"]>) {
  if (tone === "success") {
    return <IconCircleCheck size={18} />;
  }

  if (tone === "danger") {
    return <IconX size={18} />;
  }

  if (tone === "warning") {
    return <IconAlertTriangle size={18} />;
  }

  return <IconInfoCircle size={18} />;
}
