import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { RecoverPasswordForm } from "@/components/auth/RecoverPasswordForm";

export default function RecoverPasswordPage() {
  return (
    <AuthPageShell
      title="Recuperar senha"
      description="Indique o e-mail da sua conta. Se estiver cadastrado para o painel da loja, você receberá um link para definir uma nova senha."
      footer={
        <Button variant="link" className="h-auto p-0 text-sm" asChild>
          <Link href="/login">Voltar ao login</Link>
        </Button>
      }
    >
      <RecoverPasswordForm />
    </AuthPageShell>
  );
}
