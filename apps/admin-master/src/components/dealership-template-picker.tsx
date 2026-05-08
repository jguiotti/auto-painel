"use client";

import { cn } from "@autopainel/shared/lib/utils";
import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";

const templates: Array<{
  id: StorefrontLayoutTemplateId;
  title: string;
  description: string;
}> = [
  {
    id: 1,
    title: "Template 1",
    description:
      "Hero em banner com destaque à esquerda e chamadas para ação ao lado da área principal.",
  },
  {
    id: 2,
    title: "Template 2",
    description:
      "Hero central em destaque; grade de veículos mais ampla em duas colunas no desktop.",
  },
  {
    id: 3,
    title: "Template 3",
    description:
      "Hero central; vitrine em até quatro colunas e área de destaques tipo cards grandes.",
  },
];

function TemplateMiniPreview({ id }: { id: StorefrontLayoutTemplateId }) {
  if (id === 1) {
    return (
      <div className="flex h-full gap-2">
        <div className="flex flex-1 flex-col justify-center gap-1.5 py-1">
          <div className="h-2 w-full rounded bg-muted-foreground/25" />
          <div className="h-2 w-4/5 rounded bg-muted-foreground/20" />
          <div className="h-2 w-3/5 rounded bg-muted-foreground/15" />
        </div>
        <div className="w-[38%] rounded-md bg-primary/35 shadow-inner" />
      </div>
    );
  }
  if (id === 2) {
    return (
      <div className="flex h-full flex-col gap-2 pt-1">
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
    <div className="flex h-full flex-col gap-2 pt-1">
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

export function DealershipTemplatePicker({
  value,
  onChange,
  disabled,
}: {
  value: StorefrontLayoutTemplateId;
  onChange: (next: StorefrontLayoutTemplateId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {templates.map((template) => {
        const selected = value === template.id;
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
              <TemplateMiniPreview id={template.id} />
            </div>
            <span className="mt-3 text-sm font-semibold text-foreground">
              {template.title}
            </span>
            <span className="mt-1 text-xs leading-snug text-muted-foreground">
              {template.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
