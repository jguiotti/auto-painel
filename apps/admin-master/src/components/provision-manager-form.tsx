"use client";

import { useState, useTransition } from "react";

import { Button, Input, Label } from "@autopainel/shared/ui";

import { provisionDealershipManagerAction } from "@/actions/provision-dealership-manager";
import type { DealershipAdminRow } from "@/types/dealership-admin";

export function ProvisionManagerForm({
  dealerships,
}: {
  dealerships: DealershipAdminRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setTempPassword(null);
    setCreatedEmail(null);
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await provisionDealershipManagerAction(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.temporary_password) {
        setTempPassword(result.temporary_password);
      }
      if (result.email) {
        setCreatedEmail(result.email);
      }
      form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {tempPassword ? (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            Conta criada para {createdEmail}
          </p>
          <p className="mt-1 text-muted-foreground">
            Senha temporária (copie agora; não será exibida de novo):
          </p>
          <code className="mt-2 block break-all rounded bg-muted px-2 py-1 text-xs">
            {tempPassword}
          </code>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="pm-dealership">Concessionária</Label>
        <select
          id="pm-dealership"
          name="dealership_id"
          required
          disabled={pending}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Selecione…</option>
          {dealerships.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.slug})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pm-name">Nome completo</Label>
        <Input
          id="pm-name"
          name="full_name"
          required
          autoComplete="name"
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pm-email">E-mail (login)</Label>
        <Input
          id="pm-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Provisionando…" : "Criar gestor"}
      </Button>
    </form>
  );
}
