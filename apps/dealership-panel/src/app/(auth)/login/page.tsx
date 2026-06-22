import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string;
    erro?: string;
    aviso?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const raw = sp.redirectTo;
  const redirectTo =
    raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/painel";

  return (
    <AuthPageShell
      title="Entrar no painel"
      description="Use o e-mail e a senha da sua conta. Se acabou de receber um convite, abra o link do e-mail para criar sua senha antes de entrar."
      footer={
        <Button variant="link" className="h-auto p-0 text-sm" asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      }
    >
      {sp.erro === "confirmacao" ? (
        <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Não foi possível validar o link do e-mail. Solicite um novo convite ou use
          recuperação de senha.
        </p>
      ) : null}
      {sp.aviso === "definir-senha" ? (
        <p className="mb-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Para o primeiro acesso, abra o link «Criar minha senha» enviado por e-mail. Se o
          link expirou, use recuperação de senha.
        </p>
      ) : null}
      <LoginForm redirectTo={redirectTo} />
    </AuthPageShell>
  );
}
