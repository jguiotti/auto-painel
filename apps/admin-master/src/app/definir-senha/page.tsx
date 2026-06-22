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

import {
  AdminSetPasswordForm,
  type AdminSetPasswordMotivo,
} from "@/components/auth/admin-set-password-form";
import { LOGO_HORIZONTAL_SRC } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Definir senha",
  description: "Defina sua senha de acesso ao Admin AutoPainel.",
};

interface AdminSetPasswordPageProps {
  searchParams: Promise<{ motivo?: string }>;
}

function resolveMotivo(raw: string | undefined): AdminSetPasswordMotivo {
  return raw === "primeiro-acesso" ? "primeiro-acesso" : "recuperacao";
}

export default async function AdminSetPasswordPage({
  searchParams,
}: AdminSetPasswordPageProps) {
  const sp = await searchParams;
  const motivo = resolveMotivo(sp.motivo);

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
          <CardTitle className="text-2xl">
            {motivo === "primeiro-acesso" ? "Crie sua senha de acesso" : "Definir nova senha"}
          </CardTitle>
          <CardDescription>
            {motivo === "primeiro-acesso"
              ? "Este é o seu primeiro acesso ao Admin AutoPainel. Escolha uma senha forte para entrar."
              : "Escolha uma senha forte para acessar o painel central da AutoPainel."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminSetPasswordForm motivo={motivo} />
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
