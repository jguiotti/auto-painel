import type { Metadata } from "next";
import Link from "next/link";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { AdminSetPasswordForm } from "@/components/auth/admin-set-password-form";
import { LOGO_HORIZONTAL_SRC } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Definir senha",
  description: "Defina sua senha de acesso ao Admin AutoPainel.",
};

export default function AdminSetPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <img
          src={LOGO_HORIZONTAL_SRC}
          alt="AutoPainel"
          className="h-11 w-auto max-w-[260px] object-contain sm:h-12"
        />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Definir nova senha</CardTitle>
          <CardDescription>
            Escolha uma senha forte para acessar o painel central da AutoPainel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminSetPasswordForm />
          <p className="mt-6 text-center">
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link href="/login">Ir para o login</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
