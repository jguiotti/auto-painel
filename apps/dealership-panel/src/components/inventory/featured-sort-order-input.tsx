"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Input } from "@autopainel/shared/ui";

import { updateFeaturedSortOrderAction } from "@/app/painel/estoque/actions";

interface FeaturedSortOrderInputProps {
  vehicleId: string;
  value: number | null;
  disabled?: boolean;
}

export function FeaturedSortOrderInput({
  vehicleId,
  value,
  disabled = false,
}: FeaturedSortOrderInputProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localValue, setLocalValue] = useState(value == null ? "" : String(value));

  function commit(nextRaw: string) {
    const trimmed = nextRaw.trim();
    const parsed = trimmed === "" ? null : Number.parseInt(trimmed, 10);
    if (trimmed !== "" && (!Number.isFinite(parsed) || parsed! < 0 || parsed! > 9999)) {
      setError("Use um número entre 0 e 9999.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateFeaturedSortOrderAction(vehicleId, parsed);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <Input
        type="number"
        min={0}
        max={9999}
        inputMode="numeric"
        className="h-8 w-20"
        value={localValue}
        disabled={disabled || pending}
        aria-label="Posição na vitrine"
        onChange={(event) => setLocalValue(event.target.value)}
        onBlur={() => commit(localValue)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
