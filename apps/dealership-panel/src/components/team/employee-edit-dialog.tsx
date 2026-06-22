"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { BrazilianAddressFields } from "@autopainel/shared/components/brazilian-address-fields";
import type { DealershipEmployeePanelRow } from "@autopainel/shared/types";
import type { BrazilianAddressFields as BrazilianAddressShape } from "@autopainel/shared/types";
import {
  Button,
  FileUploadField,
  FormDialogShell,
  Input,
  Label,
  Separator,
} from "@autopainel/shared/ui";

import { upsertEmployeeProfileAction } from "@/app/painel/equipe/actions";

interface EmployeeEditDialogProps {
  employee: DealershipEmployeePanelRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORM_ID = "employee-edit-form";

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
    event.preventDefault();
    setError(null);
    const userId = employee!.user_id;
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
    <FormDialogShell
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setIsActive(employee.is_active);
          setError(null);
        }
      }}
      formId={FORM_ID}
      onSubmit={onSubmit}
      title="Editar colaborador"
      description={
        <>
          <span className="font-medium text-foreground">
            {employee.full_name || employee.email}
          </span>
          {employee.email ? (
            <span className="block text-muted-foreground">{employee.email}</span>
          ) : null}
          <span className="mt-1 block">Dados de RH, comissão e acesso ao painel.</span>
        </>
      }
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={pending}>
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <FileUploadField
          key={`${employee.user_id}:${employee.photo_url ?? ""}`}
          name="photo_file"
          hiddenUrlName="photo_url"
          label="Foto de perfil"
          hint="PNG, JPG, WebP ou GIF. Máximo 2 MB."
          initialRemoteUrl={employee.photo_url ?? ""}
          disabled={pending}
          previewClassName="flex justify-center bg-muted/30 py-4"
          previewImageClassName="size-24 rounded-full object-cover ring-2 ring-border"
        />

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

        <BrazilianAddressFields
          prefix="emp"
          initialAddress={readAddress(employee.address)}
          disabled={pending}
          legend="Endereço"
        />

        <Separator />

        <div className="grid gap-4 sm:grid-cols-3">
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

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 p-4">
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

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </FormDialogShell>
  );
}
