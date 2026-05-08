"use client";

import type { PricingPlanListRow, SaasModuleListRow } from "@autopainel/shared/types";
import {
  Button,
  Input,
  Label,
  Textarea,
  toast,
} from "@autopainel/shared/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createPricingPlanAction,
  deletePricingPlanAction,
  updatePricingPlanAction,
} from "@/actions/pricing-plans";

export function PricingPlanForm({
  mode,
  plan,
  modules,
  selectedModuleIds,
}: {
  mode: "create" | "edit";
  plan?: PricingPlanListRow | null;
  modules: SaasModuleListRow[];
  selectedModuleIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [delPending, startDelTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedSet = new Set(selectedModuleIds);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    startTransition(async () => {
      const result =
        mode === "edit" && plan
          ? await updatePricingPlanAction(plan.id, fd)
          : await createPricingPlanAction(fd);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        mode === "create" ? "Plano criado com sucesso." : "Plano atualizado.",
      );
      router.push("/painel/planos");
      router.refresh();
    });
  }

  function onDelete() {
    if (!plan || mode !== "edit") {
      return;
    }
    if (
      !window.confirm(
        "Eliminar este plano? Concessionárias que o utilizavam ficam sem plano dinâmico (campo limpo).",
      )
    ) {
      return;
    }
    setError(null);
    startDelTransition(async () => {
      const result = await deletePricingPlanAction(plan.id);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Plano eliminado.");
      router.push("/painel/planos");
      router.refresh();
    });
  }

  const heading =
    mode === "create" ? "Novo plano comercial" : "Editar plano comercial";

  const defaults =
    mode === "edit" && plan
      ? {
          name: plan.name,
          slug: plan.slug,
          description: plan.description ?? "",
          price_amount: plan.price_amount,
          currency_code: plan.currency_code,
          is_active: plan.is_active,
        }
      : {
          name: "",
          slug: "",
          description: "",
          price_amount: "0",
          currency_code: "BRL",
          is_active: true,
        };

  return (
    <div className="mx-auto max-w-3xl pb-12 pt-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/painel/planos"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Lista de planos
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="text-sm text-muted-foreground">
            Defina preço e marque os módulos incluídos neste plano. O slug é usado na
            etiqueta de cobrança quando atribui o plano a uma concessionária.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Detalhes</p>
          <div className="space-y-2">
            <Label htmlFor="pp-name">Nome</Label>
            <Input
              id="pp-name"
              name="name"
              required
              minLength={2}
              defaultValue={defaults.name}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-slug">Slug</Label>
            {mode === "edit" ? (
              <>
                <Input
                  id="pp-slug"
                  value={defaults.slug}
                  readOnly
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O slug não pode ser alterado para não quebrar referências internas.
                </p>
              </>
            ) : (
              <>
                <Input
                  id="pp-slug"
                  name="slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  placeholder="plano-baixada-santista"
                  defaultValue={defaults.slug}
                  disabled={pending}
                />
                <p className="text-xs text-muted-foreground">
                  Letras minúsculas, números e hífens (único na plataforma).
                </p>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pp-desc">Descrição (opcional)</Label>
            <Textarea
              id="pp-desc"
              name="description"
              rows={3}
              defaultValue={defaults.description}
              disabled={pending}
              placeholder="Notas internas ou texto para operadores."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pp-price">Preço</Label>
              <Input
                id="pp-price"
                name="price_amount"
                required
                inputMode="decimal"
                defaultValue={defaults.price_amount}
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-curr">Moeda (ISO)</Label>
              <Input
                id="pp-curr"
                name="currency_code"
                required
                maxLength={3}
                className="uppercase"
                defaultValue={defaults.currency_code}
                disabled={pending}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="pp-active"
              name="is_active"
              type="checkbox"
              defaultChecked={defaults.is_active}
              disabled={pending}
              className="size-4 rounded border border-input"
            />
            <Label htmlFor="pp-active" className="font-normal">
              Plano ativo na plataforma
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Planos inativos não entram na resolução de módulos na RPC (combinado com o
            estado do módulo).
          </p>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Módulos incluídos</p>
          <p className="text-xs text-muted-foreground">
            Marque apenas os módulos que este plano liberta. Módulos inativos no
            catálogo podem ser pré-selecionados mas não entram na vitrine até
            reativados.
          </p>
          <ul className="space-y-3">
            {modules.map((m) => (
              <li key={m.id} className="flex items-start gap-3">
                <input
                  id={`mod-${m.id}`}
                  name="module_ids"
                  type="checkbox"
                  value={m.id}
                  defaultChecked={selectedSet.has(m.id)}
                  disabled={pending}
                  className="mt-1 size-4 rounded border border-input"
                />
                <label htmlFor={`mod-${m.id}`} className="text-sm leading-tight">
                  <span className="font-medium">{m.display_name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {m.key}
                  </span>
                  {!m.is_active ? (
                    <BadgeInactive />
                  ) : null}
                  {m.description ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {m.description}
                    </span>
                  ) : null}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : mode === "create" ? "Criar plano" : "Salvar"}
          </Button>
          <Button type="button" variant="outline" asChild disabled={pending}>
            <Link href="/painel/planos">Cancelar</Link>
          </Button>
          {mode === "edit" && plan ? (
            <Button
              type="button"
              variant="destructive"
              disabled={pending || delPending}
              className="ml-auto"
              onClick={onDelete}
            >
              {delPending ? "A eliminar…" : "Eliminar plano"}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function BadgeInactive() {
  return (
    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
      inativo no catálogo
    </span>
  );
}
