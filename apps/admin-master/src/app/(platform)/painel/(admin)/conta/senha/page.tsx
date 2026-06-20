import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

import { AdminChangePasswordForm } from "@/components/admin-change-password-form";

export const metadata: Metadata = {
  title: "Alterar senha",
  description: "Atualize a senha da sua conta de operador.",
};

export default function AdminChangePasswordPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alterar senha</h1>
        <p className="text-sm text-muted-foreground">
          Use esta página quando não puder recuperar a senha por e-mail.
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
          <AdminChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
