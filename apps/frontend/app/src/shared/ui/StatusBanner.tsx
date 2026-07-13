type StatusBannerProps = {
  tone?: "neutral" | "success" | "danger";
  children: string;
};

export function StatusBanner({ tone = "neutral", children }: StatusBannerProps) {
  return <div className={`status-banner status-banner--${tone}`}>{children}</div>;
}
