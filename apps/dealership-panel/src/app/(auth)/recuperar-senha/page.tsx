import Link from "next/link";

import { RecoverPasswordForm } from "@/components/auth/RecoverPasswordForm";

export default function RecoverPasswordPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Recuperar senha
        </h1>
        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
          Indique o e-mail da sua conta. Se estiver registado para o painel da
          concessionária, receberá um link para definir uma nova senha.
        </p>
      </div>
      <RecoverPasswordForm />
      <Link
        href="/login"
        className="text-center text-sm font-medium text-zinc-600 underline dark:text-zinc-400"
      >
        Voltar ao login
      </Link>
    </div>
  );
}
