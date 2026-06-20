import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { LOGO_HORIZONTAL_SRC } from "@/lib/brand";
import { resolvePostLoginRedirectPath } from "@/lib/auth/resolve-post-login-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";
import { AdminEnvSetupRequired } from "@/components/admin-env-setup-required";
import { getAdminEnvSetupError } from "@/lib/env/get-admin-env-setup-error";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesso ao painel mestre AutoPainel.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; aviso?: string }>;
}) {
  const envError = getAdminEnvSetupError();
  if (envError) {
    return <AdminEnvSetupRequired message={envError} />;
  }

  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const redirectPath = await resolvePostLoginRedirectPath(user.id);
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <img
          src={LOGO_HORIZONTAL_SRC}
          alt="AutoPainel"
          className="h-11 w-auto max-w-[260px] object-contain sm:h-12"
        />
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Painel mestre da plataforma
        </p>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>
            Área restrita à equipe central. Operadores da plataforma e representantes
            comerciais entram com e-mail e senha cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sp.error === "forbidden" ? (
            <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Acesso negado. Use uma conta de operador da plataforma ou de representante
              comercial vinculado.
            </p>
          ) : null}
          {sp.error === "confirmacao" ? (
            <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Não foi possível validar o link do e-mail. Solicite um novo em Recuperar senha.
            </p>
          ) : null}
          {sp.aviso === "definir-senha" ? (
            <p className="mb-4 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Abra o link enviado por e-mail para definir sua senha ou faça login se já concluiu.
            </p>
          ) : null}
          <LoginForm />
          <p className="mt-4 text-center text-sm">
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link href="/recuperar-senha">Esqueci minha senha</Link>
            </Button>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Já entrou no painel? Use o menu lateral em{" "}
            <span className="font-medium text-foreground">Alterar senha</span> para trocar sem
            depender do e-mail.
          </p>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Button variant="link" className="h-auto p-0 text-xs" asChild>
              <Link href="/">Voltar ao início</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
