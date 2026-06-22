"use client";

import { useState } from "react";

import { Button, Input, Label } from "@autopainel/shared/ui";

import { requestDealershipPasswordRecoveryAction } from "@/app/(auth)/actions";

export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("email", email.trim().toLowerCase());
    const result = await requestDealershipPasswordRecoveryAction(formData);

    if (result.error) {
      setErrorMessage(
        "Não foi possível enviar o link. Verifique o e-mail ou tente novamente em instantes.",
      );
      setIsSubmitting(false);
      return;
    }

    setMessage(
      "Se o e-mail existir na plataforma, receberá instruções em breve. Verifique a caixa de spam.",
    );
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recover-email">E-mail</Label>
        <Input
          id="recover-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          placeholder="seu@email.com"
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
      {message ? (
        <p
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          role="status"
        >
          {message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}
