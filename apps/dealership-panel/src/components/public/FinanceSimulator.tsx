"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateFinanceInstallment,
  calculateTotalFinancedAmount,
} from "@/lib/finance/calculate-finance-installment";
import type { FinanceSimulationSnapshot } from "@/types/finance-simulation";

import { formatBrl } from "@/lib/format/format-brl";

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

  const financedAmount = Math.max(0, vehiclePrice - downPayment);

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
      downPayment,
      financedAmount,
      annualRatePercent,
      termMonths,
      estimatedInstallment: installment,
      estimatedTotalPayable: totalPayable,
    });
  }, [
    vehiclePrice,
    downPayment,
    financedAmount,
    annualRatePercent,
    termMonths,
    installment,
    totalPayable,
    onSnapshotChange,
  ]);

  return (
    <section
      className="rounded-xl border border-black/5 bg-[var(--dealer-surface)] p-5 shadow-sm dark:border-white/10"
      aria-labelledby="finance-simulator-title"
    >
      <h2
        id="finance-simulator-title"
        className="text-lg font-semibold text-[var(--dealer-primary)]"
      >
        Simulação de financiamento
      </h2>
      <p className="mt-1 text-sm text-[var(--dealer-fg)]/70">
        Valores estimados para planejamento. A taxa efetiva depende da análise de
        crédito e da instituição financeira.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="down-payment"
            className="text-sm font-medium text-[var(--dealer-fg)]"
          >
            Entrada (R$)
          </label>
          <input
            id="down-payment"
            type="range"
            min={0}
            max={Math.max(0, Math.floor(vehiclePrice * 0.5))}
            step={500}
            value={Math.min(downPayment, vehiclePrice)}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--dealer-accent)]"
          />
          <p className="mt-1 text-sm tabular-nums text-[var(--dealer-fg)]/80">
            {formatBrl(downPayment)} · Financiado: {formatBrl(financedAmount)}
          </p>
        </div>

        <div>
          <label
            htmlFor="annual-rate"
            className="text-sm font-medium text-[var(--dealer-fg)]"
          >
            Taxa a.a. estimada (%)
          </label>
          <input
            id="annual-rate"
            type="number"
            inputMode="decimal"
            step={0.01}
            min={0}
            value={annualRatePercent}
            onChange={(e) => setAnnualRatePercent(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label
            htmlFor="term-months"
            className="text-sm font-medium text-[var(--dealer-fg)]"
          >
            Prazo (meses)
          </label>
          <select
            id="term-months"
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-900"
          >
            {[12, 24, 36, 48, 60, 72].map((m) => (
              <option key={m} value={m}>
                {m}x
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-[var(--dealer-bg)] p-4 dark:bg-black/20">
        <p className="text-sm text-[var(--dealer-fg)]/70">Parcela estimada</p>
        <p className="text-2xl font-bold tabular-nums text-[var(--dealer-accent)]">
          {formatBrl(installment)}
        </p>
        <p className="mt-2 text-xs text-[var(--dealer-fg)]/60">
          Total aproximado no período: {formatBrl(totalPayable)}
        </p>
      </div>
    </section>
  );
}
