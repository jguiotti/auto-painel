import { cn } from "@autopainel/shared/lib/utils";

interface NavAttentionBadgeProps {
  count: number;
  className?: string;
}

export function NavAttentionBadge({ count, className }: NavAttentionBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold leading-none text-destructive-foreground",
        className,
      )}
      aria-label={`${count} contato${count === 1 ? "" : "s"} precisam de atenção`}
    >
      {label}
    </span>
  );
}
