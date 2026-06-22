import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import {
  SetPasswordForm,
  type SetPasswordMotivo,
} from "@/components/auth/SetPasswordForm";

interface SetPasswordPageProps {
  searchParams: Promise<{ motivo?: string }>;
}

function resolveMotivo(raw: string | undefined): SetPasswordMotivo {
  return raw === "primeiro-acesso" ? "primeiro-acesso" : "recuperacao";
}

export default async function SetPasswordPage({ searchParams }: SetPasswordPageProps) {
  const sp = await searchParams;
  const motivo = resolveMotivo(sp.motivo);

  return (
    <AuthPageShell
      title={motivo === "primeiro-acesso" ? "Crie sua senha de acesso" : "Definir nova senha"}
      description={
        motivo === "primeiro-acesso"
          ? "Este é o seu primeiro acesso ao painel da loja. Escolha uma senha forte — você usará este e-mail e senha para entrar da próxima vez."
          : "Escolha uma senha forte para acessar o painel da loja."
      }
      footer={
        <Button variant="link" className="h-auto p-0 text-sm" asChild>
          <Link href="/login">Ir para o login</Link>
        </Button>
      }
    >
      <SetPasswordForm motivo={motivo} />
    </AuthPageShell>
  );
}
