import type { FinanceTermMonths } from "../lib/finance/calculate-finance-simulation";

export type { FinanceTermMonths };

export interface FinanceSimulationSnapshot {
  vehiclePrice: number;
  downPayment: number;
  financedAmount: number;
  estimatedIofAmount: number;
  principalWithIof: number;
  monthlyRatePercent: number;
  termMonths: FinanceTermMonths;
  estimatedInstallment: number;
  estimatedTotalPayable: number;
  estimatedTotalInterest: number;
}
