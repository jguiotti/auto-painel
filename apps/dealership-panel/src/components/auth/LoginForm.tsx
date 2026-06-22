"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input, Label, PasswordInput } from "@autopainel/shared/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LoginFormProps {
  redirectTo: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(
        "Não foi possível entrar. Verifique e-mail e senha ou use recuperação de senha.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push(redirectTo.startsWith("/") ? redirectTo : "/painel");
    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
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
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
      <div className="space-y-2 pt-2 text-center text-sm">
        <Button variant="link" className="h-auto p-0 text-sm" asChild>
          <Link href="/recuperar-senha">Esqueci minha senha</Link>
        </Button>
        <p className="text-muted-foreground">
          Primeiro acesso? Abra o link «Criar minha senha» do e-mail de convite. Se expirou,
          use recuperação de senha abaixo.
        </p>
      </div>
    </form>
  );
}
