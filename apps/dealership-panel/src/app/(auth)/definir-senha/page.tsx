import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <AuthPageShell
      title="Definir nova senha"
      description="Escolha uma senha forte. Sua conta já deve estar associada à concessionária pela equipe AutoPainel."
      footer={
        <Button variant="link" className="h-auto p-0 text-sm" asChild>
          <Link href="/login">Ir para o login</Link>
        </Button>
      }
    >
      <SetPasswordForm />
    </AuthPageShell>
  );
}
