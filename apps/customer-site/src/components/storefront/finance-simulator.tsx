"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateFinanceSimulation,
  FINANCE_TERM_MONTHS_OPTIONS,
  type FinanceTermMonths,
} from "@autopainel/shared/lib/finance/calculate-finance-simulation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@autopainel/shared/ui";

import { formatBrl } from "@/lib/format/format-brl";
import type { FinanceSimulationSnapshot } from "@/types/finance-simulation";

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
  const [termMonths, setTermMonths] = useState<FinanceTermMonths>(48);

  const maxDown = useMemo(
    () => Math.max(0, Math.floor(vehiclePrice)),
    [vehiclePrice],
  );
  const effectiveDown = Math.min(downPayment, maxDown, vehiclePrice);

  const simulationResult = useMemo(
    () =>
      calculateFinanceSimulation({
        vehiclePrice,
        downPayment: effectiveDown,
        monthlyInterestRatePercent: monthlyRatePercent,
        termMonths,
      }),
    [vehiclePrice, effectiveDown, monthlyRatePercent, termMonths],
  );

  const isValidSimulation = simulationResult.financedAmount > 0;

  useEffect(() => {
    if (!onSnapshotChange) {
      return;
    }

    if (!isValidSimulation) {
      onSnapshotChange(null);
      return;
    }

    onSnapshotChange({
      vehiclePrice: simulationResult.vehiclePrice,
      downPayment: simulationResult.downPayment,
      financedAmount: simulationResult.financedAmount,
      estimatedIofAmount: simulationResult.estimatedIofAmount,
      principalWithIof: simulationResult.principalWithIof,
      monthlyRatePercent: simulationResult.monthlyRatePercent,
      termMonths: simulationResult.termMonths,
      estimatedInstallment: simulationResult.estimatedInstallment,
      estimatedTotalPayable: simulationResult.estimatedTotalPayable,
      estimatedTotalInterest: simulationResult.estimatedTotalInterest,
    });
  }, [isValidSimulation, onSnapshotChange, simulationResult]);

  return (
    <Card aria-labelledby="finance-simulator-title">
      <CardHeader>
        <CardTitle
          id="finance-simulator-title"
          className="text-[var(--primary-color,var(--dealer-primary))]"
        >
          Simule seu financiamento
        </CardTitle>
        <CardDescription>
          Ajuste a entrada e o prazo para ver uma estimativa da parcela mensal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="down-payment">Valor da entrada</Label>
            <span className="text-sm font-medium tabular-nums text-[var(--storefront-fg,var(--dealer-fg))]">
              {formatBrl(effectiveDown)}
            </span>
          </div>
          <input
            id="down-payment"
            type="range"
            min={0}
            max={maxDown}
            step={500}
            value={effectiveDown}
            onChange={(event) => setDownPayment(Number(event.target.value))}
            className="mt-1 w-full accent-[var(--secondary-color,var(--dealer-accent))]"
          />
          <p className="text-xs text-[var(--storefront-fg,var(--dealer-fg))]/65">
            Valor financiado: {formatBrl(simulationResult.financedAmount)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="term-months">Quantidade de parcelas</Label>
          <Select
            value={String(termMonths)}
            onValueChange={(value) => setTermMonths(Number(value) as FinanceTermMonths)}
          >
            <SelectTrigger id="term-months" className="w-full">
              <SelectValue placeholder="Selecione o prazo" />
            </SelectTrigger>
            <SelectContent>
              {FINANCE_TERM_MONTHS_OPTIONS.map((months) => (
                <SelectItem key={months} value={String(months)}>
                  {months}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isValidSimulation ? (
          <div className="rounded-xl border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_18%,transparent)] bg-[color-mix(in_srgb,var(--storefront-bg,var(--dealer-bg))_92%,white)] p-5">
            <p className="text-sm text-[var(--storefront-fg,var(--dealer-fg))]/70">
              Parcela estimada
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--secondary-color,var(--dealer-accent))]">
              {formatBrl(simulationResult.estimatedInstallment)}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--storefront-fg,var(--dealer-fg))]/60">
              Inclui estimativa de IOF ({formatBrl(simulationResult.estimatedIofAmount)}) sobre o
              valor financiado. Total aproximado no período:{" "}
              {formatBrl(simulationResult.estimatedTotalPayable)}.
            </p>
            <p className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--primary-color,var(--dealer-primary))_12%,transparent)] bg-[var(--storefront-surface,var(--dealer-surface))] px-3 py-2 text-xs leading-relaxed text-[var(--storefront-fg,var(--dealer-fg))]/75">
              Valores sujeitos a análise de crédito e condições da instituição financeira.
              Simulação meramente ilustrativa.
            </p>
          </div>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400">
            A entrada deve ser menor que o valor do veículo para simular o financiamento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
