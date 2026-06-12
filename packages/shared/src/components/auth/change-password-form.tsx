"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Label, PasswordInput } from "@autopainel/shared/ui";

export interface ChangePasswordFormProps {
  /** Called with current and new password; return an error message or null on success. */
  onChangePassword: (params: {
    currentPassword: string;
    password: string;
  }) => Promise<string | null>;
  /** Path after successful update (defaults to parent refresh only). */
  redirectTo?: string;
  submitLabel?: string;
  minLength?: number;
}

export function ChangePasswordForm({
  onChangePassword,
  redirectTo,
  submitLabel = "Salvar nova senha",
  minLength = 8,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword.trim()) {
      setErrorMessage("Informe sua senha atual.");
      return;
    }
    if (password.length < minLength) {
      setErrorMessage(`A nova senha deve ter pelo menos ${minLength} caracteres.`);
      return;
    }
    if (password !== password2) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }
    if (password === currentPassword) {
      setErrorMessage("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setIsSubmitting(true);

    const error = await onChangePassword({ currentPassword, password });
    if (error) {
      setErrorMessage(error);
      setIsSubmitting(false);
      return;
    }

    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
    setIsSubmitting(false);
    setCurrentPassword("");
    setPassword("");
    setPassword2("");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Senha atual</Label>
        <PasswordInput
          id="current-password"
          name="current_password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <PasswordInput
          id="new-password"
          name="password"
          autoComplete="new-password"
          required
          minLength={minLength}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar nova senha</Label>
        <PasswordInput
          id="confirm-password"
          name="password2"
          autoComplete="new-password"
          required
          minLength={minLength}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      {errorMessage ? (
        <p
          className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
