"use client";

import { Button, Input, Label, Textarea, toast } from "@autopainel/shared/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createSaasModuleAction } from "@/actions/saas-modules";

export function SaasModuleCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createSaasModuleAction(fd);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Módulo criado.");
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
        <h1 className="text-2xl font-bold tracking-tight">Novo módulo</h1>
        <p className="text-sm text-muted-foreground">
          Defina uma chave técnica estável (snake_case) e o texto mostrado aos operadores.
          Planos comerciais passam a poder incluir este módulo na checklist.
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
            <Label htmlFor="sm-new-key">Chave técnica</Label>
            <Input
              id="sm-new-key"
              name="key"
              required
              minLength={2}
              maxLength={64}
              pattern="[a-z][a-z0-9_]*"
              placeholder="meu_modulo"
              disabled={pending}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Letras minúsculas, números e sublinhados; deve começar com letra.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-new-name">Nome na interface</Label>
            <Input
              id="sm-new-name"
              name="display_name"
              required
              minLength={2}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-new-desc">Descrição (opcional)</Label>
            <Textarea
              id="sm-new-desc"
              name="description"
              rows={3}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sm-new-sort">Ordem de lista</Label>
            <Input
              id="sm-new-sort"
              name="sort_order"
              type="number"
              min={0}
              max={9999}
              required
              defaultValue="100"
              disabled={pending}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="sm-new-active"
              name="is_active"
              type="checkbox"
              defaultChecked
              disabled={pending}
              className="size-4 rounded border border-input"
            />
            <Label htmlFor="sm-new-active" className="font-normal">
              Módulo ativo no catálogo
            </Label>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={pending}>
            {pending ? "Criando…" : "Criar módulo"}
          </Button>
          <Button type="button" variant="outline" asChild disabled={pending}>
            <Link href="/painel/modulos">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
