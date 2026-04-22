import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@autopainel/shared/ui";

import { verifyAdminSessionToken } from "@/lib/auth/admin-session";
import { COOKIE_NAME } from "@/lib/auth/cookie-name";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesso ao painel mestre AutoPainel.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (verifyAdminSessionToken(token)) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">AutoPainel Admin</CardTitle>
          <CardDescription>
            Área restrita à equipe central. Informe a senha mestra.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
