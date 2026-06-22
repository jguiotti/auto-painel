"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { EMPLOYEE_ROLE_LABELS } from "@autopainel/shared/types";
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

export function TeamInviteDialog({ open, onOpenChange }: TeamInviteDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [role, setRole] = useState<"seller" | "manager">("seller");

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
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar colaborador</DialogTitle>
          <DialogDescription>
            Cria o acesso no painel da loja e envia e-mail para definir senha. Gestores da
            plataforma também podem convidar pelo admin-master.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-full-name">Nome completo</Label>
            <Input id="invite-full-name" name="full_name" required minLength={2} disabled={pending} />
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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando…" : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
