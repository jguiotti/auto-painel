"use client";

import type { SaasModuleListRow } from "@autopainel/shared/types";
import { Button, Input, Label, Textarea, toast } from "@autopainel/shared/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateSaasModuleAction } from "@/actions/saas-modules";

export function SaasModuleForm({ module }: { module: SaasModuleListRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateSaasModuleAction(module.id, fd);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Módulo atualizado.");
      router.push("/painel/modulos");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl pb-12 pt-6">
      <div className="mb-8 space-y-1">
        <Link
          href="/painel/modulos"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← Catálogo de módulos
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Editar módulo</h1>
        <p className="text-sm text-muted-foreground">
          A chave técnica (<span className="font-mono">{module.key}</span>) é estável no
          código; altere apenas texto apresentado e disponibilidade.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="sm-key">Chave (somente leitura)</Label>
            <Input
              id="sm-key"
              value={module.key}
              readOnly
              disabled
              className="bg-muted font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-name">Nome na interface</Label>
            <Input
              id="sm-name"
              name="display_name"
              required
              minLength={2}
              defaultValue={module.display_name}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-desc">Descrição (opcional)</Label>
            <Textarea
              id="sm-desc"
              name="description"
              rows={3}
              defaultValue={module.description ?? ""}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-sort">Ordem de lista</Label>
            <Input
              id="sm-sort"
              name="sort_order"
              type="number"
              min={0}
              max={9999}
              required
              defaultValue={String(module.sort_order)}
              disabled={pending}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="sm-active"
              name="is_active"
              type="checkbox"
              defaultChecked={module.is_active}
              disabled={pending}
              className="size-4 rounded border border-input"
            />
            <Label htmlFor="sm-active" className="font-normal">
              Módulo ativo no catálogo
            </Label>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
          <Button type="button" variant="outline" asChild disabled={pending}>
            <Link href="/painel/modulos">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
