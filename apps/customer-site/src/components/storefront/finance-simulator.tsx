"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";
import { Input } from "@autopainel/shared/ui";
import { Label } from "@autopainel/shared/ui";

import { formatBrl } from "@/lib/format/format-brl";
import {
  calculateFinanceInstallment,
  calculateTotalFinancedAmount,
} from "@/lib/finance/calculate-finance-installment";
import type { FinanceSimulationSnapshot } from "@/types/finance-simulation";

interface FinanceSimulatorProps {
  vehiclePrice: number;
  onSnapshotChange?: (snapshot: FinanceSimulationSnapshot) => void;
}

export function FinanceSimulator({
  vehiclePrice,
  onSnapshotChange,
}: FinanceSimulatorProps) {
  const [downPayment, setDownPayment] = useState(() =>
    Math.min(5000, Math.round(vehiclePrice * 0.1)),
  );
  const [annualRatePercent, setAnnualRatePercent] = useState(11.99);
  const [termMonths, setTermMonths] = useState(48);

  const maxDown = useMemo(
    () => Math.max(0, Math.floor(vehiclePrice * 0.5)),
    [vehiclePrice],
  );
  const effectiveDown = Math.min(downPayment, maxDown, vehiclePrice);
  const financedAmount = Math.max(0, vehiclePrice - effectiveDown);

  const installment = useMemo(
    () =>
      calculateFinanceInstallment(
        financedAmount,
        annualRatePercent,
        termMonths,
      ),
    [financedAmount, annualRatePercent, termMonths],
  );

  const totalPayable = useMemo(
    () => calculateTotalFinancedAmount(installment, termMonths),
    [installment, termMonths],
  );

  useEffect(() => {
    if (!onSnapshotChange) {
      return;
    }
    onSnapshotChange({
      vehiclePrice,
      downPayment: effectiveDown,
      financedAmount,
      annualRatePercent,
      termMonths,
      estimatedInstallment: installment,
      estimatedTotalPayable: totalPayable,
    });
  }, [
    vehiclePrice,
    effectiveDown,
    financedAmount,
    annualRatePercent,
    termMonths,
    installment,
    totalPayable,
    onSnapshotChange,
  ]);

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
          Valores estimados para planejamento. A taxa efetiva depende da análise
          de crédito e da instituição financeira.
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
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--dealer-accent)]"
          />
          <p className="mt-1 text-sm tabular-nums text-[var(--dealer-fg)]/80">
            {formatBrl(effectiveDown)} · Financiado: {formatBrl(financedAmount)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="annual-rate">Taxa a.a. estimada (%)</Label>
          <Input
            id="annual-rate"
            type="number"
            inputMode="decimal"
            step={0.01}
            min={0}
            value={annualRatePercent}
            onChange={(e) => setAnnualRatePercent(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="term-months">Prazo (meses)</Label>
          <select
            id="term-months"
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {[12, 24, 36, 48, 60, 72].map((m) => (
              <option key={m} value={m}>
                {m}x
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg bg-[var(--dealer-bg)] p-4 dark:bg-black/20">
          <p className="text-sm text-[var(--dealer-fg)]/70">Parcela estimada</p>
          <p className="text-2xl font-bold tabular-nums text-[var(--dealer-accent)]">
            {formatBrl(installment)}
          </p>
          <p className="mt-2 text-xs text-[var(--dealer-fg)]/60">
            Total aproximado no período: {formatBrl(totalPayable)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
