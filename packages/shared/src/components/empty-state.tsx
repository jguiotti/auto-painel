import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "../lib/utils";
import { Button } from "../ui/button";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-6 text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
      {action ? (
        <div className="mt-5">
          {action.href ? (
            <Button asChild variant="default" size="sm">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button type="button" variant="default" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
