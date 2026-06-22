"use client";

import { AppSystemErrorBoundary } from "@autopainel/shared/components/system/app-system-error-boundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppSystemErrorBoundary error={error} reset={reset} tone="storefront" homeHref="/" />
  );
}
