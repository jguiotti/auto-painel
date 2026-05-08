"use client";

import { useEffect, useMemo, useState } from "react";

import { calculatePriceInstallment } from "@autopainel/shared/lib/finance/calculate-price-installment";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";
import { Input } from "@autopainel/shared/ui";
import { Label } from "@autopainel/shared/ui";

import { formatBrl } from "@/lib/format/format-brl";
import type { FinanceSimulationSnapshot } from "@/types/finance-simulation";

const FINANCE_TERMS = [24, 36, 48, 60] as const;

interface FinanceSimulatorProps {
  vehiclePrice: number;
  monthlyRatePercent: number;
  onSnapshotChange?: (snapshot: FinanceSimulationSnapshot | null) => void;
}

export function FinanceSimulator({
  vehiclePrice,
  monthlyRatePercent,
  onSnapshotChange,
}: FinanceSimulatorProps) {
  const [downPayment, setDownPayment] = useState(() =>
    Math.min(5000, Math.round(vehiclePrice * 0.1)),
  );
  const [termMonths, setTermMonths] = useState<(typeof FINANCE_TERMS)[number]>(48);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const maxDown = useMemo(
    () => Math.max(0, Math.floor(vehiclePrice)),
    [vehiclePrice],
  );
  const effectiveDown = Math.min(downPayment, maxDown, vehiclePrice);
  const financedAmount = Math.max(0, vehiclePrice - effectiveDown);

  const simulationResult = useMemo(
    () =>
      calculatePriceInstallment({
        financedAmount,
        monthlyInterestRatePercent: monthlyRatePercent,
        termMonths,
      }),
    [financedAmount, monthlyRatePercent, termMonths],
  );

  useEffect(() => {
    if (!onSnapshotChange) {
      return;
    }
    if (!hasCalculated || financedAmount <= 0) {
      return;
    }

    onSnapshotChange({
      vehiclePrice,
      downPayment: effectiveDown,
      financedAmount,
      monthlyRatePercent,
      termMonths,
      estimatedInstallment: simulationResult.installmentAmount,
      estimatedTotalPayable: simulationResult.totalPayable,
      estimatedTotalInterest: simulationResult.totalInterest,
    });
  }, [
    hasCalculated,
    vehiclePrice,
    effectiveDown,
    financedAmount,
    monthlyRatePercent,
    termMonths,
    simulationResult.installmentAmount,
    simulationResult.totalPayable,
    simulationResult.totalInterest,
    onSnapshotChange,
  ]);

  function resetCalculationState() {
    setHasCalculated(false);
    setValidationMessage(null);
    onSnapshotChange?.(null);
  }

  function handleDownPaymentChange(value: number) {
    resetCalculationState();
    setDownPayment(value);
  }

  function handleTermMonthsChange(value: (typeof FINANCE_TERMS)[number]) {
    resetCalculationState();
    setTermMonths(value);
  }

  function handleCalculateClick() {
    if (financedAmount <= 0) {
      setValidationMessage(
        "A entrada deve ser menor que o valor do veículo para gerar uma simulação.",
      );
      setHasCalculated(false);
      onSnapshotChange?.(null);
      return;
    }

    setValidationMessage(null);
    setHasCalculated(true);
  }

  return (
    <Card aria-labelledby="finance-simulator-title">
      <CardHeader>
        <CardTitle
          id="finance-simulator-title"
          className="text-[var(--dealer-primary)]"
        >
          Simulação de financiamento
        </CardTitle>
        <CardDescription>
          Informe entrada e parcelas para calcular uma estimativa em Tabela Price.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="down-payment">Entrada (R$)</Label>
          <input
            id="down-payment"
            type="range"
            min={0}
            max={maxDown}
            step={500}
            value={effectiveDown}
            onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--dealer-accent)]"
          />
          <p className="mt-1 text-sm tabular-nums text-[var(--dealer-fg)]/80">
            {formatBrl(effectiveDown)} · Financiado: {formatBrl(financedAmount)}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Taxa mensal aplicada</Label>
          <Input value={`${monthlyRatePercent.toFixed(2)}% a.m.`} readOnly />
        </div>

        <div className="space-y-2">
          <Label htmlFor="term-months">Prazo (meses)</Label>
          <select
            id="term-months"
            value={termMonths}
            onChange={(e) =>
              handleTermMonthsChange(
                Number(e.target.value) as (typeof FINANCE_TERMS)[number],
              )
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {FINANCE_TERMS.map((m) => (
              <option key={m} value={m}>
                {m}x
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          className="bg-[var(--dealer-primary)] text-white hover:opacity-95"
          onClick={handleCalculateClick}
        >
          Calcular parcela
        </Button>

        {validationMessage ? (
          <p className="text-sm text-red-600 dark:text-red-400">{validationMessage}</p>
        ) : null}

        {hasCalculated ? (
          <div className="rounded-lg bg-[var(--dealer-bg)] p-4 dark:bg-black/20">
            <p className="text-sm text-[var(--dealer-fg)]/70">Parcela estimada</p>
            <p className="text-2xl font-bold tabular-nums text-[var(--dealer-accent)]">
              {formatBrl(simulationResult.installmentAmount)}
            </p>
            <p className="mt-2 text-xs text-[var(--dealer-fg)]/60">
              Total aproximado no período: {formatBrl(simulationResult.totalPayable)}
            </p>
            <p className="mt-1 text-xs text-[var(--dealer-fg)]/60">
              Juros totais estimados: {formatBrl(simulationResult.totalInterest)}
            </p>
            <p className="mt-3 text-xs text-[var(--dealer-fg)]/70">
              Estimativa para referência. Sujeita a análise de crédito e condições da
              instituição financeira.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
