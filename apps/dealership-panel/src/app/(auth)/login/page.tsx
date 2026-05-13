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
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Entrar
        </h1>
        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
          Inicie sessão com o e-mail e palavra-passe da sua conta. Se não conseguir entrar ou não tiver
          credenciais, contacte quem gere o painel na sua concessionária ou o suporte AutoPainel.
        </p>
      </div>
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
