export interface FinanceSimulationSnapshot {
  vehiclePrice: number;
  downPayment: number;
  financedAmount: number;
  monthlyRatePercent: number;
  termMonths: 24 | 36 | 48 | 60;
  estimatedInstallment: number;
  estimatedTotalPayable: number;
  estimatedTotalInterest: number;
}
