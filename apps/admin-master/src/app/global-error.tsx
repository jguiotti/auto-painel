"use client";

import { AppSystemErrorBoundary } from "@autopainel/shared/components/system/app-system-error-boundary";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AppSystemErrorBoundary
          error={error}
          reset={reset}
          tone="admin"
          homeHref="/painel/dashboard"
        />
      </body>
    </html>
  );
}
