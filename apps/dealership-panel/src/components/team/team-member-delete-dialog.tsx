"use client";

import { useState, useTransition } from "react";

import type { DealershipEmployeePanelRow } from "@autopainel/shared/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@autopainel/shared/ui";

import { removeTeamMemberAction } from "@/app/painel/equipe/actions";

interface TeamMemberDeleteDialogProps {
  employee: DealershipEmployeePanelRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamMemberDeleteDialog({
  employee,
  open,
  onOpenChange,
}: TeamMemberDeleteDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setErrorMessage(null);
    }
    onOpenChange(nextOpen);
  }

  function handleConfirm() {
    if (!employee) {
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = await removeTeamMemberAction(employee.user_id);
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      handleOpenChange(false);
    });
  }

  const displayName = employee?.full_name?.trim() || employee?.email || "colaborador";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
          <AlertDialogDescription>
            {employee?.role === "owner" ? (
              <>O titular da loja não pode ser removido por aqui.</>
            ) : (
              <>
                <strong>{displayName}</strong> perderá o acesso ao painel desta loja. Enviaremos
                um e-mail avisando que a conta foi desativada e encerraremos as sessões ativas.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          {employee?.role !== "owner" ? (
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => handleConfirm()}
            >
              {isPending ? "Removendo…" : "Remover da loja"}
            </Button>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
