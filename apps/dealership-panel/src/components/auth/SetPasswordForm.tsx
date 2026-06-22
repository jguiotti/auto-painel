"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button, Label, PasswordInput } from "@autopainel/shared/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SetPasswordMotivo = "primeiro-acesso" | "recuperacao";

interface SetPasswordFormProps {
  motivo?: SetPasswordMotivo;
  afterSavePath?: string;
}

export function SetPasswordForm({
  motivo = "recuperacao",
  afterSavePath = "/painel",
}: SetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<"loading" | "ready" | "missing">(
    "loading",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    const supabase = createSupabaseBrowserClient();

    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (cancelled) {
        return;
      }
      if (userData.user) {
        setSessionState("ready");
        return;
      }

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled && session?.user) {
          setSessionState("ready");
        }
      });
      unsubscribe = () => listener.subscription.unsubscribe();

      window.setTimeout(() => {
        if (cancelled) {
          return;
        }
        void supabase.auth.getUser().then(({ data }) => {
          if (cancelled) {
            return;
          }
          setSessionState(data.user ? "ready" : "missing");
        });
      }, 1200);
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace(afterSavePath);
    router.refresh();
    setIsSubmitting(false);
  }

  if (sessionState === "loading") {
    return <div className="text-sm text-muted-foreground">Validando seu convite…</div>;
  }

  if (sessionState === "missing") {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {motivo === "primeiro-acesso"
            ? "Este link de convite expirou ou já foi usado. Solicite um novo convite à loja ou use recuperação de senha com o mesmo e-mail."
            : "Este link expirou ou já foi usado. Solicite um novo e-mail em recuperação de senha."}
        </p>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/recuperar-senha">Solicitar novo link</Link>
        </Button>
        <Button variant="link" className="h-auto w-full p-0 text-sm" asChild>
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  const primaryLabel = motivo === "primeiro-acesso" ? "Criar senha" : "Nova senha";
  const confirmLabel =
    motivo === "primeiro-acesso" ? "Confirmar senha" : "Confirmar nova senha";
  const submitLabel =
    motivo === "primeiro-acesso" ? "Criar senha e entrar" : "Salvar e entrar";

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="np1">{primaryLabel}</Label>
        <PasswordInput
          id="np1"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="np2">{confirmLabel}</Label>
        <PasswordInput
          id="np2"
          name="password2"
          autoComplete="new-password"
          required
          minLength={8}
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
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
