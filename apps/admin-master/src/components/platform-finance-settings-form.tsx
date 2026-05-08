"use client";

import { useState, useTransition } from "react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@autopainel/shared/ui";

import { updatePlatformFinanceSettingsAction } from "@/actions/platform-finance-settings";

interface PlatformFinanceSettingsFormProps {
  monthlyRatePercent: number;
}

export function PlatformFinanceSettingsForm({
  monthlyRatePercent,
}: PlatformFinanceSettingsFormProps) {
  const [pending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updatePlatformFinanceSettingsAction(formData);
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      setSuccessMessage("Taxa global atualizada com sucesso.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração global do simulador</CardTitle>
        <CardDescription>
          Defina a taxa mensal padrão usada no cálculo do Simulador de financiamento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="finance-monthly-rate">Taxa mensal (%)</Label>
            <Input
              id="finance-monthly-rate"
              name="finance_monthly_interest_rate_percent"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.01}
              defaultValue={monthlyRatePercent}
              disabled={pending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Exemplo: 1,99 representa 1,99% ao mês.
            </p>
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              {successMessage}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar taxa global"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
