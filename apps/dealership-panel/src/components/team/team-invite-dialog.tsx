"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { EMPLOYEE_ROLE_LABELS } from "@autopainel/shared/types";
import {
  Button,
  FormDialogShell,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@autopainel/shared/ui";

import { inviteTeamMemberAction } from "@/app/painel/equipe/actions";

interface TeamInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORM_ID = "team-invite-form";

export function TeamInviteDialog({ open, onOpenChange }: TeamInviteDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<"seller" | "manager">("seller");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      setSuccess(null);
      setRole("seller");
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await inviteTeamMemberAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(
        result.passwordResetEmailSent
          ? "Convite enviado. A pessoa receberá um e-mail para definir a senha."
          : "Colaborador adicionado. Peça para usar «Esqueci minha senha» no login se necessário.",
      );
      form.reset();
      setRole("seller");
      router.refresh();
    });
  }

  return (
    <FormDialogShell
      open={open}
      onOpenChange={handleOpenChange}
      formId={FORM_ID}
      onSubmit={handleSubmit}
      title="Convidar colaborador"
      description="Cria o acesso no painel da loja e envia e-mail de boas-vindas para definir a senha."
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
          >
            Fechar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={pending}>
            {pending ? "Enviando…" : "Enviar convite"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="invite-full-name">Nome completo</Label>
          <Input
            id="invite-full-name"
            name="full_name"
            required
            minLength={2}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-email">E-mail</Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            required
            autoComplete="off"
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Papel</Label>
          <input type="hidden" name="role" value={role} />
          <Select
            value={role}
            onValueChange={(value) => setRole(value as "seller" | "manager")}
            disabled={pending}
          >
            <SelectTrigger id="invite-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seller">{EMPLOYEE_ROLE_LABELS.seller}</SelectItem>
              <SelectItem value="manager">{EMPLOYEE_ROLE_LABELS.manager}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
      </div>
    </FormDialogShell>
  );
}
