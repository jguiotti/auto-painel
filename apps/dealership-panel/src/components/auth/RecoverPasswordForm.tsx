"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setMessage(null);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin.trim() : "";
    const next = encodeURIComponent("/definir-senha");
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${origin}/auth/confirm?next=${next}`,
      },
    );

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage(
      "Se o e-mail existir na plataforma, receberá instruções em breve. Verifique a caixa de spam.",
    );
    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label
          htmlFor="recover-email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          E-mail
        </label>
        <input
          id="recover-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {isSubmitting ? "A enviar…" : "Enviar link"}
      </button>
    </form>
  );
}
