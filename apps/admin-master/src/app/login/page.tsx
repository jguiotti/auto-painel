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

import { fetchProfileRowForUserId } from "@/lib/auth/fetch-profile-for-admin";
import { isPlatformOperatorProfile } from "@/lib/auth/platform-operator-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesso ao painel mestre AutoPainel.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { profile } = await fetchProfileRowForUserId(user.id);

    if (isPlatformOperatorProfile(profile)) {
      redirect("/painel/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">AutoPainel Admin</CardTitle>
          <CardDescription>
            Área restrita à equipe central. Entre com o e-mail e a senha da conta
            cadastrada como super administradora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sp.error === "forbidden" ? (
            <p className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Acesso negado. Apenas contas com perfil de super administradora
              (sem concessionária vinculada) podem usar este painel.
            </p>
          ) : null}
          <LoginForm />
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
