"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@autopainel/shared/ui";

import { upsertContentCalendarItemAction } from "@/actions/platform-content-calendar";
import {
  CONTENT_CALENDAR_CHANNELS,
  CONTENT_CALENDAR_CHANNEL_LABELS,
} from "@/lib/data/platform-content-calendar-shared";

export function ContentCalendarCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      setError(null);
      const result = await upsertContentCalendarItemAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
      {error ? (
        <p className="md:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="scheduled_for">
          Data
        </label>
        <input
          id="scheduled_for"
          name="scheduled_for"
          type="date"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="channel">
          Canal
        </label>
        <select
          id="channel"
          name="channel"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue="instagram"
        >
          {CONTENT_CALENDAR_CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {CONTENT_CALENDAR_CHANNEL_LABELS[channel]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="title">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="objective">
          Objetivo
        </label>
        <input
          id="objective"
          name="objective"
          placeholder="awareness, seo, conversion…"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue="draft"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="draft">Rascunho</option>
          <option value="scheduled">Agendado</option>
        </select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium" htmlFor="body_notes">
          Notas / roteiro
        </label>
        <textarea
          id="body_notes"
          name="body_notes"
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="md:col-span-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : "Adicionar ao calendário"}
        </Button>
      </div>
    </form>
  );
}
