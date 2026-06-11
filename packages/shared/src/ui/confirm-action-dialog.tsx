"use client";

import * as React from "react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

interface ConfirmActionDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  confirmPendingLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  disabled?: boolean;
  onConfirm: () => void | Promise<{ error?: string } | void>;
}

export function ConfirmActionDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirmar",
  confirmPendingLabel = "Aguarde…",
  cancelLabel = "Cancelar",
  confirmVariant = "default",
  disabled = false,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleConfirm() {
    setErrorMessage(null);
    setPending(true);
    try {
      const result = await onConfirm();
      if (result && typeof result === "object" && "error" in result && result.error) {
        setErrorMessage(result.error);
        return;
      }
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) {
          return;
        }
        setOpen(nextOpen);
        if (!nextOpen) {
          setErrorMessage(null);
        }
      }}
    >
      <AlertDialogTrigger asChild disabled={disabled}>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant={confirmVariant}
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? confirmPendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
