import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="card fade-in flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-white/5 text-[var(--accent)]">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
