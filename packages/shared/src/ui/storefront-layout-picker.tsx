"use client";

import { cn } from "../lib/utils";
import { STOREFRONT_LAYOUT_TEMPLATES } from "../lib/storefront/layout-template-catalog";
import type { StorefrontLayoutTemplateId } from "../types/dealership-storefront";
import { StorefrontLayoutPreview } from "./storefront-layout-preview";

export interface StorefrontLayoutPickerProps {
  value: StorefrontLayoutTemplateId;
  onChange: (next: StorefrontLayoutTemplateId) => void;
  disabled?: boolean;
  /** Use marketing labels (Layout 1 — clássico) instead of admin template names. */
  labelMode?: "admin" | "marketing";
  className?: string;
}

export function StorefrontLayoutPicker({
  value,
  onChange,
  disabled,
  labelMode = "admin",
  className,
}: StorefrontLayoutPickerProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {STOREFRONT_LAYOUT_TEMPLATES.map((template) => {
        const selected = value === template.id;
        const title =
          labelMode === "marketing" ? template.marketingTitle : template.title;

        return (
          <button
            key={template.id}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(template.id)}
            className={cn(
              "flex flex-col rounded-lg border bg-card p-3 text-left shadow-sm outline-none transition-colors",
              selected
                ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "border-border hover:border-muted-foreground/40",
              disabled && "pointer-events-none opacity-60",
            )}
          >
            <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-muted/30 p-2">
              <StorefrontLayoutPreview layoutId={template.id} />
            </div>
            <span className="mt-3 text-sm font-semibold text-foreground">{title}</span>
            <span className="mt-1 text-xs leading-snug text-muted-foreground">
              {template.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
