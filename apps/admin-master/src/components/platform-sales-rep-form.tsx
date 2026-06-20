"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  toast,
} from "@autopainel/shared/ui";

import {
  createPlatformSalesRepAction,
  updatePlatformSalesRepAction,
} from "@/actions/platform-sales-reps";
import {
  PLATFORM_SALES_REP_STATUS_LABELS,
  PLATFORM_SALES_REP_STATUSES,
  type PlatformSalesRepRecord,
} from "@/lib/data/platform-sales-squad-shared";

interface PlatformSalesRepFormProps {
  mode: "create" | "edit";
  rep?: PlatformSalesRepRecord;
}

export function PlatformSalesRepForm({ mode, rep }: PlatformSalesRepFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultCommissionPercent = rep
    ? String(rep.default_commission_rate_bps / 100)
    : "10";

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPlatformSalesRepAction(formData)
          : await updatePlatformSalesRepAction(rep!.id, formData);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create" ? "Representante cadastrado." : "Dados atualizados.",
      );

      if (result.salesRepId) {
        router.push(`/painel/equipe/comercial/${result.salesRepId}`);
        router.refresh();
        return;
      }

      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "create" ? "Novo representante comercial" : "Editar representante"}
        </CardTitle>
        <CardDescription>
          Dados pessoais, comissão padrão e status de integração.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-8">
          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Dados pessoais</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  defaultValue={rep?.full_name ?? ""}
                  placeholder="Ex.: Ana Silva"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={rep?.email ?? ""}
                  placeholder="nome@autopainel.com.br"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={rep?.phone ?? ""}
                  placeholder="(11) 98765-4321"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_cpf">CPF</Label>
                <Input
                  id="document_cpf"
                  name="document_cpf"
                  defaultValue={rep?.document_cpf ?? ""}
                />
                <p className="text-xs text-muted-foreground">
                  Usado apenas para pagamentos. Acesso restrito ao financeiro.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Contrato comercial</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hire_date">Data de admissão</Label>
                <Input
                  id="hire_date"
                  name="hire_date"
                  type="date"
                  defaultValue={rep?.hire_date ?? ""}
                />
              </div>
              {mode === "edit" ? (
                <div className="space-y-2">
                  <Label htmlFor="termination_date">Data de desligamento</Label>
                  <Input
                    id="termination_date"
                    name="termination_date"
                    type="date"
                    defaultValue={rep?.termination_date ?? ""}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="default_commission_rate_percent">
                  Comissão recorrente padrão (%)
                </Label>
                <Input
                  id="default_commission_rate_percent"
                  name="default_commission_rate_percent"
                  defaultValue={defaultCommissionPercent}
                  inputMode="decimal"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Percentual sobre a mensalidade enquanto a loja permanecer ativa na carteira
                  deste representante.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={rep?.status ?? "onboarding"}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {PLATFORM_SALES_REP_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PLATFORM_SALES_REP_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="user_id">ID do usuário Auth (opcional)</Label>
                <Input
                  id="user_id"
                  name="user_id"
                  defaultValue={rep?.user_id ?? ""}
                  placeholder="UUID da conta de login do representante"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold">Observações internas</h2>
            <Textarea
              name="notes"
              defaultValue={rep?.notes ?? ""}
              placeholder="Anotações visíveis só para operadores e financeiro."
              rows={4}
            />
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar representante"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={rep ? `/painel/equipe/comercial/${rep.id}` : "/painel/equipe/comercial"}>
                Cancelar
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
