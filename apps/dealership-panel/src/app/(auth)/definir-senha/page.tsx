import Link from "next/link";

import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Definir nova senha
        </h1>
        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
          Escolha uma senha forte. A sua conta já deve estar associada à
          concessionária pela equipa AutoPainel.
        </p>
      </div>
      <SetPasswordForm />
      <Link
        href="/login"
        className="text-center text-sm font-medium text-zinc-600 underline dark:text-zinc-400"
      >
        Ir para o login
      </Link>
    </div>
  );
}
