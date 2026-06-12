import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { DealershipChangePasswordForm } from "@/components/auth/DealershipChangePasswordForm";

export const metadata: Metadata = {
  title: "Alterar senha",
  description: "Atualize a senha de acesso ao painel da loja.",
};

export default function DealershipChangePasswordPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alterar senha</h1>
        <p className="text-sm text-muted-foreground">
          Defina uma nova senha sem depender do e-mail de recuperação.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Nova senha</CardTitle>
          <CardDescription>
            Informe a senha atual e escolha uma nova senha com pelo menos 8 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DealershipChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
