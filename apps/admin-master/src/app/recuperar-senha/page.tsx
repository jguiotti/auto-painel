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

import { AdminRecoverPasswordForm } from "@/components/auth/admin-recover-password-form";
import { LOGO_HORIZONTAL_SRC } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Redefina a senha do Admin AutoPainel.",
};

export default function AdminRecoverPasswordPage() {
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
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>
            Informe o e-mail da sua conta de operador. Enviaremos um link para definir uma nova
            senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminRecoverPasswordForm />
          <p className="mt-6 text-center">
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link href="/login">Voltar ao login</Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
