"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BrazilianAddressFields } from "@autopainel/shared/components/brazilian-address-fields";
import type { DealershipEmployeePanelRow } from "@autopainel/shared/types";
import type { BrazilianAddressFields as BrazilianAddressShape } from "@autopainel/shared/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@autopainel/shared/ui";

import { upsertEmployeeProfileAction } from "@/app/painel/equipe/actions";

interface EmployeeEditDialogProps {
  employee: DealershipEmployeePanelRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function readAddress(raw: unknown): BrazilianAddressShape {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as BrazilianAddressShape;
}

export function EmployeeEditDialog({
  employee,
  open,
  onOpenChange,
}: EmployeeEditDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  if (!employee) {
    return null;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!employee) {
      return;
    }
    event.preventDefault();
    setError(null);
    const userId = employee.user_id;
    const formData = new FormData(event.currentTarget);
    formData.set("is_active", isActive ? "true" : "false");

    startTransition(async () => {
      const result = await upsertEmployeeProfileAction(userId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next && employee) {
          setIsActive(employee.is_active);
          setError(null);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
            <DialogDescription>
              {employee.email ?? employee.full_name} — dados de RH e comissão.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emp-full_name">Nome completo</Label>
              <Input
                id="emp-full_name"
                name="full_name"
                defaultValue={employee.full_name}
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-phone">Telefone</Label>
              <Input
                id="emp-phone"
                name="phone"
                defaultValue={employee.phone ?? ""}
                disabled={pending}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emp-cpf">CPF</Label>
                <Input
                  id="emp-cpf"
                  name="cpf"
                  defaultValue={employee.cpf ?? ""}
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-rg">RG</Label>
                <Input
                  id="emp-rg"
                  name="rg"
                  defaultValue={employee.rg ?? ""}
                  disabled={pending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-photo_url">URL da foto</Label>
              <Input
                id="emp-photo_url"
                name="photo_url"
                type="url"
                defaultValue={employee.photo_url ?? ""}
                placeholder="https://..."
                disabled={pending}
              />
            </div>

            <BrazilianAddressFields
              prefix="emp"
              initialAddress={readAddress(employee.address)}
              disabled={pending}
              legend="Endereço"
            />

            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="emp-base_salary">Salário base (R$)</Label>
                <Input
                  id="emp-base_salary"
                  name="base_salary"
                  inputMode="decimal"
                  defaultValue={
                    employee.base_salary != null ? String(employee.base_salary) : ""
                  }
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-commission_percent">Comissão (%)</Label>
                <Input
                  id="emp-commission_percent"
                  name="commission_percent"
                  inputMode="decimal"
                  defaultValue={
                    employee.commission_percent != null
                      ? String(employee.commission_percent)
                      : ""
                  }
                  disabled={pending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-commission_fixed">Fixo por veículo (R$)</Label>
                <Input
                  id="emp-commission_fixed"
                  name="commission_fixed_per_vehicle"
                  inputMode="decimal"
                  defaultValue={
                    employee.commission_fixed_per_vehicle != null
                      ? String(employee.commission_fixed_per_vehicle)
                      : ""
                  }
                  disabled={pending}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Acesso ao painel</p>
                <p className="text-xs text-muted-foreground">
                  Desative para bloquear login sem remover a conta.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                disabled={pending}
                aria-label="Colaborador ativo"
                className="size-4 shrink-0 rounded border border-input accent-primary"
              />
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
