import Link from "next/link";

import { Button } from "@autopainel/shared/ui";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const raw = sp.redirectTo;
  const redirectTo =
    raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/painel";

  return (
    <AuthPageShell
      title="Entrar no painel"
      description="Use o e-mail e a senha da sua conta. Se não tiver acesso, fale com quem administra a loja ou com o suporte AutoPainel."
      footer={
        <Button variant="link" className="h-auto p-0 text-sm" asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthPageShell>
  );
}
