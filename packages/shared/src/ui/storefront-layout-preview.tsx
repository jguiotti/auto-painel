import type { StorefrontLayoutTemplateId } from "../types/dealership-storefront";
import { cn } from "../lib/utils";

export interface StorefrontLayoutPreviewProps {
  layoutId: StorefrontLayoutTemplateId;
  className?: string;
}

export function StorefrontLayoutPreview({ layoutId, className }: StorefrontLayoutPreviewProps) {
  if (layoutId === 1) {
    return (
      <div className={cn("flex h-full gap-2", className)}>
        <div className="flex flex-1 flex-col justify-center gap-1.5 py-1">
          <div className="h-2 w-full rounded bg-muted-foreground/25" />
          <div className="h-2 w-4/5 rounded bg-muted-foreground/20" />
          <div className="h-2 w-3/5 rounded bg-muted-foreground/15" />
        </div>
        <div className="w-[38%] rounded-md bg-primary/35 shadow-inner" />
      </div>
    );
  }

  if (layoutId === 2) {
    return (
      <div className={cn("flex h-full flex-col gap-2 pt-1", className)}>
        <div className="mx-auto h-[42%] w-[82%] rounded-md bg-primary/40 shadow-inner" />
        <div className="grid flex-1 grid-cols-2 gap-1.5">
          <div className="rounded bg-muted-foreground/20" />
          <div className="rounded bg-muted-foreground/20" />
          <div className="rounded bg-muted-foreground/15" />
          <div className="rounded bg-muted-foreground/15" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col gap-2 pt-1", className)}>
      <div className="h-[28%] w-full rounded-md bg-primary/35 shadow-inner" />
      <div className="grid flex-1 grid-cols-4 gap-1">
        <div className="rounded bg-muted-foreground/22" />
        <div className="rounded bg-muted-foreground/22" />
        <div className="rounded bg-muted-foreground/18" />
        <div className="rounded bg-muted-foreground/18" />
      </div>
      <div className="grid h-[22%] grid-cols-2 gap-1">
        <div className="rounded bg-muted-foreground/14" />
        <div className="rounded bg-muted-foreground/14" />
      </div>
    </div>
  );
}
